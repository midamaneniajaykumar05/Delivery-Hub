import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, restaurantsTable, reviewsTable } from "@workspace/db";
import { eq, avg, count } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";

const router = Router();

router.get("/admin/users", authenticate, requireRole("admin"), async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const role = req.query.role as string | undefined;
  let all = await db.select().from(usersTable);
  if (role) all = all.filter(u => u.role === role);
  const data = all.slice((page - 1) * limit, page * limit).map(u => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt.toISOString()
  }));
  res.json({ data, total: all.length, page, limit });
});

router.patch("/admin/users/:id", authenticate, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, role } = req.body;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (role) updates.role = role;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.get("/admin/restaurants", authenticate, requireRole("admin"), async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const all = await db.select().from(restaurantsTable);
  const ratings = await db.select({
    restaurantId: reviewsTable.restaurantId,
    avgRating: avg(reviewsTable.rating),
    totalReviews: count(reviewsTable.id),
  }).from(reviewsTable).groupBy(reviewsTable.restaurantId);
  const ratingMap = Object.fromEntries(ratings.map(r => [r.restaurantId, r]));
  const data = all.slice((page - 1) * limit, page * limit).map(r => ({
    ...r,
    avgRating: ratingMap[r.id] ? parseFloat(ratingMap[r.id].avgRating || "0") : null,
    totalReviews: ratingMap[r.id]?.totalReviews || 0,
  }));
  res.json({ data, total: all.length, page, limit });
});

export default router;
