import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, ordersTable, paymentsTable, reviewsTable, restaurantsTable, notificationsTable, deliveryPartnersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";

const router = Router();

// Admin: get all payments
router.get("/admin/payments", authenticate, requireRole("admin"), async (_req, res) => {
  const payments = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.createdAt));
  const enriched = await Promise.all(payments.map(async (p) => {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, p.orderId));
    const [user] = order ? await db.select().from(usersTable).where(eq(usersTable.id, order.userId)) : [null];
    return {
      id: p.id, orderId: p.orderId, amount: p.amount, status: p.status,
      transactionId: p.transactionId, createdAt: p.createdAt.toISOString(),
      userName: user?.name || "Unknown", userEmail: user?.email || "",
    };
  }));
  res.json({ data: enriched, total: enriched.length });
});

// Admin: get all reviews
router.get("/admin/reviews", authenticate, requireRole("admin"), async (_req, res) => {
  const reviews = await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
  const enriched = await Promise.all(reviews.map(async (r) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));
    const [rest] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, r.restaurantId));
    return {
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt.toISOString(),
      userName: user?.name || "Unknown", restaurantName: rest?.name || "Unknown",
      restaurantId: r.restaurantId, userId: r.userId,
    };
  }));
  res.json({ data: enriched, total: enriched.length });
});

// Admin: delete a review
router.delete("/admin/reviews/:id", authenticate, requireRole("admin"), async (req, res) => {
  await db.delete(reviewsTable).where(eq(reviewsTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

// Admin: get all delivery partners
router.get("/admin/delivery-partners", authenticate, requireRole("admin"), async (_req, res) => {
  const partners = await db.select().from(deliveryPartnersTable);
  const enriched = await Promise.all(partners.map(async (p) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId));
    const delivered = await db.select().from(ordersTable).where(eq(ordersTable.deliveryPartnerId, p.userId));
    return {
      id: p.id, userId: p.userId, vehicleNumber: p.vehicleNumber,
      totalDeliveries: delivered.length,
      name: user?.name || "Unknown", email: user?.email || "", phone: user?.phone || null,
      role: user?.role || "delivery_partner",
    };
  }));
  res.json({ data: enriched, total: enriched.length });
});

// Admin: get all orders
router.get("/admin/orders", authenticate, requireRole("admin"), async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const all = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const paged = all.slice((page - 1) * limit, page * limit);
  const enriched = await Promise.all(paged.map(async (o) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, o.userId));
    const [rest] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, o.restaurantId));
    return {
      id: o.id, status: o.status, totalAmount: o.totalAmount, createdAt: o.createdAt.toISOString(),
      userName: user?.name || "Unknown", restaurantName: rest?.name || "Unknown",
    };
  }));
  res.json({ data: enriched, total: all.length, page, limit });
});

export default router;
