import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, cartsTable, menuItemsTable, restaurantsTable, usersTable, notificationsTable, deliveryPartnersTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";
import { sendOrderPlacedEmail, sendOrderStatusEmail } from "../services/email";
import { broadcastOrderUpdate, sendNotificationToUser } from "../services/websocket";

const router = Router();

async function buildOrder(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const itemsEnriched = await Promise.all(items.map(async (oi) => {
    const [mi] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, oi.menuItemId));
    return { id: oi.id, menuItemId: oi.menuItemId, name: mi?.name || "", quantity: oi.quantity, price: oi.price, image: mi?.image || null };
  }));
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, order.restaurantId));
  let deliveryPartnerName: string | null = null;
  if (order.deliveryPartnerId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, order.deliveryPartnerId));
    deliveryPartnerName = u?.name || null;
  }
  return {
    id: order.id, userId: order.userId, restaurantId: order.restaurantId,
    restaurantName: restaurant?.name || "", totalAmount: order.totalAmount,
    status: order.status, deliveryPartnerId: order.deliveryPartnerId,
    deliveryPartnerName, createdAt: order.createdAt.toISOString(), items: itemsEnriched
  };
}

async function createNotification(userId: number, title: string, message: string, type: string) {
  await db.insert(notificationsTable).values({ userId, title, message, type, isRead: "false" });
}

router.post("/orders", authenticate, requireRole("customer"), async (req: AuthRequest, res) => {
  const { restaurantId, deliveryAddress } = req.body;
  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.userId, req.user!.id));
  if (!cart) { res.status(400).json({ error: "Cart is empty" }); return; }
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  if (items.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  let total = 0;
  const orderItemsData = await Promise.all(items.map(async (ci) => {
    const [mi] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, ci.menuItemId));
    const price = mi?.price || 0;
    total += price * ci.quantity;
    return { menuItemId: ci.menuItemId, quantity: ci.quantity, price };
  }));

  const [order] = await db.insert(ordersTable).values({
    userId: req.user!.id, restaurantId: restaurantId || cart.restaurantId,
    totalAmount: total, status: "pending", deliveryAddress: deliveryAddress || null
  }).returning();

  await db.insert(orderItemsTable).values(orderItemsData.map(i => ({ ...i, orderId: order.id })));
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  await db.update(cartsTable).set({ restaurantId: null }).where(eq(cartsTable.id, cart.id));

  await createNotification(req.user!.id, "Order Placed", `Your order #${order.id} has been placed successfully.`, "order");
  sendNotificationToUser(req.user!.id, { type: "order", title: "Order Placed", orderId: order.id });

  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId || cart.restaurantId!));
  const [userRec] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (userRec) {
    sendOrderPlacedEmail(userRec.email, userRec.name, order.id, total, restaurant?.name || "the restaurant").catch(() => {});
  }

  res.status(201).json(await buildOrder(order));
});

router.get("/orders", authenticate, async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;
  const offset = (page - 1) * limit;

  let allOrders: typeof ordersTable.$inferSelect[] = [];

  if (req.user!.role === "customer") {
    allOrders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user!.id)).orderBy(desc(ordersTable.createdAt));
  } else if (req.user!.role === "restaurant_owner") {
    const [r] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerId, req.user!.id));
    if (r) {
      allOrders = await db.select().from(ordersTable).where(eq(ordersTable.restaurantId, r.id)).orderBy(desc(ordersTable.createdAt));
    }
  } else if (req.user!.role === "delivery_partner") {
    allOrders = await db.select().from(ordersTable).where(eq(ordersTable.deliveryPartnerId, req.user!.id)).orderBy(desc(ordersTable.createdAt));
  } else {
    allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  }

  if (status) allOrders = allOrders.filter(o => o.status === status);
  const paged = allOrders.slice(offset, offset + limit);
  const data = await Promise.all(paged.map(buildOrder));
  res.json({ data, total: allOrders.length, page, limit });
});

router.get("/orders/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildOrder(order));
});

router.patch("/orders/:id/status", authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { status, deliveryPartnerId } = req.body;
  const updates: Record<string, unknown> = { status };
  if (deliveryPartnerId !== undefined) updates.deliveryPartnerId = deliveryPartnerId;
  const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }

  // Notify customer
  const statusMessages: Record<string, string> = {
    accepted: "Your order has been accepted by the restaurant!",
    preparing: "The restaurant is now preparing your order.",
    ready_for_pickup: "Your order is ready for pickup!",
    out_for_delivery: "Your order is out for delivery!",
    delivered: "Your order has been delivered. Enjoy your meal!",
    cancelled: "Your order has been cancelled.",
  };
  if (statusMessages[status]) {
    await createNotification(order.userId, "Order Update", statusMessages[status], "order_status");
    broadcastOrderUpdate(order.userId, order.id, status);
    const [userRec] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
    if (userRec) sendOrderStatusEmail(userRec.email, userRec.name, order.id, status).catch(() => {});
  }

  res.json(await buildOrder(order));
});

export default router;
