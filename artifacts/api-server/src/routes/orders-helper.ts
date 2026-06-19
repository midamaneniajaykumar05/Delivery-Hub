import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, menuItemsTable, restaurantsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function buildOrderFn(order: typeof ordersTable.$inferSelect) {
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
