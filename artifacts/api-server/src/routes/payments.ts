import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable, ordersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

// Simulate payment intent (Stripe-style) without real Stripe SDK for now
// In production: use stripe.paymentIntents.create(...)
router.post("/payments/create-intent", authenticate, async (req: AuthRequest, res) => {
  const { orderId } = req.body;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  // Create a payment record
  const [payment] = await db.insert(paymentsTable).values({
    orderId, amount: order.totalAmount, status: "pending", transactionId: null
  }).returning();

  // Return a simulated client secret (in production, this comes from Stripe)
  const clientSecret = `pi_simulated_${payment.id}_secret_${Date.now()}`;
  res.json({ clientSecret, amount: order.totalAmount, currency: "usd" });
});

router.post("/payments/confirm", authenticate, async (req: AuthRequest, res) => {
  const { orderId, paymentIntentId } = req.body;

  // Update payment record
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

  // Update order status
  const [order] = await db.update(ordersTable)
    .set({ status: "payment_completed" })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (order) {
    await db.insert(notificationsTable).values({
      userId: order.userId, title: "Payment Successful",
      message: `Payment of $${payment.amount.toFixed(2)} confirmed for order #${orderId}.`,
      type: "payment", isRead: "false"
    });
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
  res.json(userPayments.map(p => ({
    id: p.id, orderId: p.orderId, amount: p.amount,
    transactionId: p.transactionId, status: p.status,
    createdAt: p.createdAt.toISOString()
  })));
});

export default router;
