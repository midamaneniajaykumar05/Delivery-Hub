import { Router } from "express";
import { db } from "@workspace/db";
import { restaurantsTable, categoriesTable, menuItemsTable, reviewsTable } from "@workspace/db";
import { eq, like, sql, and, or } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

// Categories
router.get("/categories", async (_req, res) => {
  const cats = await db.select().from(categoriesTable);
  res.json(cats);
});

router.post("/categories", authenticate, requireRole("admin"), async (req, res) => {
  const { name } = req.body;
  const [cat] = await db.insert(categoriesTable).values({ name }).returning();
  res.status(201).json(cat);
});

// Restaurants
router.get("/restaurants", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  let query = db.select().from(restaurantsTable).where(eq(restaurantsTable.status, "active"));
  if (search) {
    query = db.select().from(restaurantsTable).where(
      and(eq(restaurantsTable.status, "active"), like(restaurantsTable.name, `%${search}%`))
    ) as typeof query;
  }

  const all = await query;
  const data = all.slice(offset, offset + limit);

  // Compute avg ratings
  const withRatings = await Promise.all(data.map(async (r) => {
    const revs = await db.select().from(reviewsTable).where(eq(reviewsTable.restaurantId, r.id));
    const avg = revs.length > 0 ? revs.reduce((s, x) => s + x.rating, 0) / revs.length : null;
    return { ...r, avgRating: avg ? Math.round(avg * 10) / 10 : null, totalReviews: revs.length };
  }));

  res.json({ data: withRatings, total: all.length, page, limit });
});

router.post("/restaurants", authenticate, requireRole("restaurant_owner", "admin"), async (req: AuthRequest, res) => {
  const { name, address, phone, image } = req.body;
  const [r] = await db.insert(restaurantsTable).values({
    ownerId: req.user!.id, name, address, phone: phone || null, image: image || null, status: "active"
  }).returning();
  res.status(201).json({ ...r, avgRating: null, totalReviews: 0 });
});

router.get("/restaurants/my", authenticate, requireRole("restaurant_owner"), async (req: AuthRequest, res) => {
  const [r] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerId, req.user!.id));
  if (!r) { res.status(404).json({ error: "No restaurant found" }); return; }
  const items = await db.select({
    id: menuItemsTable.id, restaurantId: menuItemsTable.restaurantId,
    categoryId: menuItemsTable.categoryId, name: menuItemsTable.name,
    description: menuItemsTable.description, price: menuItemsTable.price,
    image: menuItemsTable.image, available: menuItemsTable.available,
    categoryName: categoriesTable.name,
  })
  .from(menuItemsTable)
  .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
  .where(eq(menuItemsTable.restaurantId, r.id));
  const revs = await db.select().from(reviewsTable).where(eq(reviewsTable.restaurantId, r.id));
  const avg = revs.length > 0 ? revs.reduce((s, x) => s + x.rating, 0) / revs.length : null;
  res.json({ ...r, avgRating: avg ? Math.round(avg * 10) / 10 : null, totalReviews: revs.length, menuItems: items });
});

router.get("/restaurants/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [r] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, id));
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select({
    id: menuItemsTable.id, restaurantId: menuItemsTable.restaurantId,
    categoryId: menuItemsTable.categoryId, name: menuItemsTable.name,
    description: menuItemsTable.description, price: menuItemsTable.price,
    image: menuItemsTable.image, available: menuItemsTable.available,
    categoryName: categoriesTable.name,
  })
  .from(menuItemsTable)
  .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
  .where(eq(menuItemsTable.restaurantId, id));
  const revs = await db.select().from(reviewsTable).where(eq(reviewsTable.restaurantId, id));
  const avg = revs.length > 0 ? revs.reduce((s, x) => s + x.rating, 0) / revs.length : null;
  res.json({ ...r, avgRating: avg ? Math.round(avg * 10) / 10 : null, totalReviews: revs.length, menuItems: items });
});

router.patch("/restaurants/:id", authenticate, requireRole("restaurant_owner", "admin"), async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { name, address, phone, image, status } = req.body;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (address) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (image !== undefined) updates.image = image;
  if (status) updates.status = status;
  const [r] = await db.update(restaurantsTable).set(updates).where(eq(restaurantsTable.id, id)).returning();
  res.json({ ...r, avgRating: null, totalReviews: 0 });
});

router.delete("/restaurants/:id", authenticate, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(restaurantsTable).where(eq(restaurantsTable.id, id));
  res.status(204).send();
});

export default router;
