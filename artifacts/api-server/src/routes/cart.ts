import { Router } from "express";
import { db } from "@workspace/db";
import { cartsTable, cartItemsTable, menuItemsTable, restaurantsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function getOrCreateCart(userId: number) {
  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.userId, userId));
  if (!cart) {
    [cart] = await db.insert(cartsTable).values({ userId, restaurantId: null }).returning();
  }
  return cart;
}

async function buildCartResponse(userId: number) {
  const cart = await getOrCreateCart(userId);
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

  const enriched = await Promise.all(items.map(async (ci) => {
    const [mi] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, ci.menuItemId));
    return {
      id: ci.id, menuItemId: ci.menuItemId, name: mi?.name || "", price: mi?.price || 0,
      quantity: ci.quantity, subtotal: (mi?.price || 0) * ci.quantity, image: mi?.image || null
    };
  }));

  const total = enriched.reduce((s, i) => s + i.subtotal, 0);
  let restaurantName: string | null = null;
  if (cart.restaurantId) {
    const [r] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, cart.restaurantId));
    restaurantName = r?.name || null;
  }
  return { id: cart.id, userId: cart.userId, items: enriched, total, restaurantId: cart.restaurantId, restaurantName };
}

router.get("/cart", authenticate, async (req: AuthRequest, res) => {
  res.json(await buildCartResponse(req.user!.id));
});

router.post("/cart/add", authenticate, async (req: AuthRequest, res) => {
  const { menuItemId, quantity } = req.body;
  const [mi] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, menuItemId));
  if (!mi) { res.status(404).json({ error: "Item not found" }); return; }

  const cart = await getOrCreateCart(req.user!.id);

  // If different restaurant, clear cart
  if (cart.restaurantId && cart.restaurantId !== mi.restaurantId) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
    await db.update(cartsTable).set({ restaurantId: mi.restaurantId }).where(eq(cartsTable.id, cart.id));
  } else if (!cart.restaurantId) {
    await db.update(cartsTable).set({ restaurantId: mi.restaurantId }).where(eq(cartsTable.id, cart.id));
  }

  const [existing] = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.menuItemId, menuItemId)));

  if (existing) {
    await db.update(cartItemsTable).set({ quantity: existing.quantity + quantity }).where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({ cartId: cart.id, menuItemId, quantity });
  }

  res.json(await buildCartResponse(req.user!.id));
});

router.delete("/cart/remove/:itemId", authenticate, async (req: AuthRequest, res) => {
  const itemId = parseInt(req.params.itemId);
  const cart = await getOrCreateCart(req.user!.id);
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.cartId, cart.id)));

  // Check if cart is empty, reset restaurant
  const remaining = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  if (remaining.length === 0) {
    await db.update(cartsTable).set({ restaurantId: null }).where(eq(cartsTable.id, cart.id));
  }

  res.json(await buildCartResponse(req.user!.id));
});

router.delete("/cart/clear", authenticate, async (req: AuthRequest, res) => {
  const cart = await getOrCreateCart(req.user!.id);
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  await db.update(cartsTable).set({ restaurantId: null }).where(eq(cartsTable.id, cart.id));
  res.json({ success: true });
});

export default router;
