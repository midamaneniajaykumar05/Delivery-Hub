import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { paymentsTable, ordersTable, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";
import { sendPaymentSuccessEmail, sendPaymentFailureEmail } from "../services/email";
import { sendNotificationToUser } from "../services/websocket";

const router = Router();

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require("razorpay");
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

router.post("/payments/razorpay/create-order", authenticate, async (req: AuthRequest, res) => {
  const { orderId } = req.body;
  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503).json({ error: "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const amountInPaise = Math.round(order.totalAmount * 100);
  const rzpOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `order_${orderId}`,
    notes: { orderId: String(orderId) },
  });

  await db.insert(paymentsTable).values({
    orderId, amount: order.totalAmount, status: "pending", transactionId: rzpOrder.id
  });

  res.json({
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

router.post("/payments/razorpay/verify", authenticate, async (req: AuthRequest, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) { res.status(503).json({ error: "Razorpay not configured" }); return; }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (expectedSignature !== razorpaySignature) {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
    if (order) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
      if (user) await sendPaymentFailureEmail(user.email, user.name, orderId);
    }
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  const [payment] = await db.update(paymentsTable)
    .set({ status: "completed", transactionId: razorpayPaymentId })
    .where(eq(paymentsTable.orderId, orderId))
    .returning();

  const [order] = await db.update(ordersTable)
    .set({ status: "payment_completed" })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (order) {
    const notification = {
      title: "Payment Successful",
      message: `Payment of ₹${payment.amount.toFixed(2)} confirmed for order #${orderId}.`,
      type: "payment",
    };
    await db.insert(notificationsTable).values({ userId: order.userId, ...notification, isRead: "false" });
    sendNotificationToUser(order.userId, notification);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
    if (user) await sendPaymentSuccessEmail(user.email, user.name, orderId, payment.amount, razorpayPaymentId);
  }

  res.json({ success: true, paymentId: razorpayPaymentId, orderId });
});

router.get("/payments/razorpay/config", (_req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || null, configured: !!process.env.RAZORPAY_KEY_ID });
});

export default router;
