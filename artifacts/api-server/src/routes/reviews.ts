import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/reviews", authenticate, requireRole("customer"), async (req: AuthRequest, res) => {
  const { restaurantId, rating, comment } = req.body;
  const [review] = await db.insert(reviewsTable).values({
    userId: req.user!.id, restaurantId, rating, comment: comment || null
  }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.status(201).json({
    id: review.id, userId: review.userId, userName: user?.name || "",
    restaurantId: review.restaurantId, rating: review.rating,
    comment: review.comment, createdAt: review.createdAt.toISOString()
  });
});

router.get("/reviews", async (req, res) => {
  const restaurantId = parseInt(req.query.restaurantId as string);
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.restaurantId, restaurantId));
  const enriched = await Promise.all(reviews.map(async (r) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));
    return { id: r.id, userId: r.userId, userName: user?.name || "Guest", restaurantId: r.restaurantId, rating: r.rating, comment: r.comment, createdAt: r.createdAt.toISOString() };
  }));
  res.json(enriched);
});

export default router;
