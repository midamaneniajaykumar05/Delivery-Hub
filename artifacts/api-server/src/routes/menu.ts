import { Router } from "express";
import { db } from "@workspace/db";
import { menuItemsTable, categoriesTable } from "@workspace/db";
import { eq, and, like } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/menu", async (req, res) => {
  const restaurantId = parseInt(req.query.restaurantId as string);
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  const search = req.query.search as string | undefined;

  let conditions = [eq(menuItemsTable.restaurantId, restaurantId)];
  if (categoryId) conditions.push(eq(menuItemsTable.categoryId, categoryId));

  const items = await db.select({
    id: menuItemsTable.id, restaurantId: menuItemsTable.restaurantId,
    categoryId: menuItemsTable.categoryId, name: menuItemsTable.name,
    description: menuItemsTable.description, price: menuItemsTable.price,
    image: menuItemsTable.image, available: menuItemsTable.available,
    categoryName: categoriesTable.name,
  })
  .from(menuItemsTable)
  .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
  .where(and(...conditions));

  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items;
  res.json(filtered);
});

router.post("/menu", authenticate, requireRole("restaurant_owner", "admin"), async (req, res) => {
  const { restaurantId, categoryId, name, description, price, image, available } = req.body;
  const [item] = await db.insert(menuItemsTable).values({
    restaurantId, categoryId: categoryId || null, name,
    description: description || null, price,
    image: image || null, available: available ?? true,
  }).returning();
  res.status(201).json({ ...item, categoryName: null });
});

router.patch("/menu/:id", authenticate, requireRole("restaurant_owner", "admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  const { categoryId, name, description, price, image, available } = req.body;
  const updates: Record<string, unknown> = {};
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = price;
  if (image !== undefined) updates.image = image;
  if (available !== undefined) updates.available = available;
  const [item] = await db.update(menuItemsTable).set(updates).where(eq(menuItemsTable.id, id)).returning();

  let categoryName: string | null = null;
  if (item.categoryId) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, item.categoryId));
    categoryName = cat?.name || null;
  }
  res.json({ ...item, categoryName });
});

router.delete("/menu/:id", authenticate, requireRole("restaurant_owner", "admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
  res.status(204).send();
});

export default router;
