import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable, ordersTable, notificationsTable, usersTable, restaurantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";
import { sendPaymentSuccessEmail } from "../services/email";
import { sendNotificationToUser } from "../services/websocket";

const router = Router();

router.post("/payments/create-intent", authenticate, async (req: AuthRequest, res) => {
  const { orderId } = req.body;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const [payment] = await db.insert(paymentsTable).values({
    orderId, amount: order.totalAmount, status: "pending", transactionId: null
  }).returning();

  const clientSecret = `pi_simulated_${payment.id}_secret_${Date.now()}`;
  res.json({ clientSecret, amount: order.totalAmount, currency: "inr", paymentId: payment.id });
});

router.post("/payments/confirm", authenticate, async (req: AuthRequest, res) => {
  const { orderId, paymentIntentId } = req.body;

  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.orderId, orderId));
  let payment = payments[0];
  if (!payment) {
    [payment] = await db.insert(paymentsTable).values({
      orderId, amount: 0, status: "completed", transactionId: paymentIntentId
    }).returning();
  } else {
    [payment] = await db.update(paymentsTable)
      .set({ status: "completed", transactionId: paymentIntentId })
      .where(eq(paymentsTable.id, payment.id))
      .returning();
  }

  const [order] = await db.update(ordersTable)
    .set({ status: "payment_completed" })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (order) {
    const notification = {
      title: "Payment Successful",
      message: `Payment of $${payment.amount.toFixed(2)} confirmed for order #${orderId}.`,
      type: "payment",
    };
    await db.insert(notificationsTable).values({ userId: order.userId, ...notification, isRead: "false" });
    sendNotificationToUser(order.userId, notification);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
    const [rest] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, order.restaurantId));
    if (user) {
      sendPaymentSuccessEmail(user.email, user.name, orderId, payment.amount, paymentIntentId).catch(() => {});
    }
  }

  res.json({
    id: payment.id, orderId: payment.orderId, amount: payment.amount,
    transactionId: payment.transactionId, status: payment.status,
    createdAt: payment.createdAt.toISOString()
  });
});

router.get("/payments/history", authenticate, async (req: AuthRequest, res) => {
  const userOrders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user!.id));
  const orderIds = userOrders.map(o => o.id);
  if (orderIds.length === 0) { res.json([]); return; }
  const payments = await db.select().from(paymentsTable);
  const userPayments = payments.filter(p => orderIds.includes(p.orderId));
  const enriched = await Promise.all(userPayments.map(async (p) => {
    const order = userOrders.find(o => o.id === p.orderId);
    const [rest] = order ? await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, order.restaurantId)) : [null];
    return {
      id: p.id, orderId: p.orderId, amount: p.amount,
      transactionId: p.transactionId, status: p.status,
      createdAt: p.createdAt.toISOString(),
      restaurantName: rest?.name || "Unknown",
      orderStatus: order?.status || "unknown",
    };
  }));
  res.json(enriched);
});

export default router;
