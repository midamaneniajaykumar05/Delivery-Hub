import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, paymentsTable, usersTable, restaurantsTable, orderItemsTable, menuItemsTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/analytics/summary", authenticate, requireRole("admin", "restaurant_owner"), async (req: AuthRequest, res) => {
  const orders = await db.select().from(ordersTable);
  const payments = await db.select().from(paymentsTable);
  const users = await db.select().from(usersTable);
  const restaurants = await db.select().from(restaurantsTable);

  let filteredOrders = orders;
  if (req.user!.role === "restaurant_owner") {
    const [r] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerId, req.user!.id));
    filteredOrders = r ? orders.filter(o => o.restaurantId === r.id) : [];
  }

  const completed = filteredOrders.filter(o => o.status === "delivered");
  const cancelled = filteredOrders.filter(o => o.status === "cancelled");
  const totalRevenue = completed.reduce((s, o) => s + o.totalAmount, 0);
  const completedPayments = payments.filter(p => p.status === "completed");
  const paymentSuccessRate = payments.length > 0 ? (completedPayments.length / payments.length) * 100 : 0;

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders: filteredOrders.length,
    completedOrders: completed.length,
    cancelledOrders: cancelled.length,
    averageOrderValue: filteredOrders.length > 0 ? Math.round((totalRevenue / filteredOrders.length) * 100) / 100 : 0,
    paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10,
    activeRestaurants: restaurants.filter(r => r.status === "active").length,
    totalCustomers: users.filter(u => u.role === "customer").length,
  });
});

router.get("/analytics/revenue", authenticate, requireRole("admin", "restaurant_owner"), async (req: AuthRequest, res) => {
  const period = (req.query.period as string) || "daily";
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.status, "delivered"));

  // Build data points grouped by date
  const map = new Map<string, { revenue: number; orders: number }>();

  const now = new Date();
  let days = period === "daily" ? 14 : period === "weekly" ? 8 * 7 : 90;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { revenue: 0, orders: 0 });
  }

  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (map.has(key)) {
      const entry = map.get(key)!;
      entry.revenue += o.totalAmount;
      entry.orders += 1;
    }
  }

  const result = Array.from(map.entries()).map(([date, v]) => ({
    date, revenue: Math.round(v.revenue * 100) / 100, orders: v.orders
  }));
  res.json(result);
});

router.get("/analytics/top-foods", authenticate, requireRole("admin", "restaurant_owner"), async (req: AuthRequest, res) => {
  const orderItems = await db.select().from(orderItemsTable);
  const itemMap = new Map<number, { totalOrdered: number; revenue: number }>();
  for (const oi of orderItems) {
    const existing = itemMap.get(oi.menuItemId) || { totalOrdered: 0, revenue: 0 };
    existing.totalOrdered += oi.quantity;
    existing.revenue += oi.price * oi.quantity;
    itemMap.set(oi.menuItemId, existing);
  }
  const sorted = Array.from(itemMap.entries()).sort((a, b) => b[1].totalOrdered - a[1].totalOrdered).slice(0, 10);
  const result = await Promise.all(sorted.map(async ([menuItemId, stats]) => {
    const [mi] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, menuItemId));
    const [r] = mi?.restaurantId ? await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, mi.restaurantId)) : [];
    return { id: menuItemId, name: mi?.name || "", restaurantName: r?.name || "", totalOrdered: stats.totalOrdered, revenue: Math.round(stats.revenue * 100) / 100, image: mi?.image || null };
  }));
  res.json(result);
});

router.get("/analytics/top-restaurants", authenticate, requireRole("admin"), async (req: AuthRequest, res) => {
  const orders = await db.select().from(ordersTable);
  const rMap = new Map<number, { totalOrders: number; revenue: number }>();
  for (const o of orders) {
    const existing = rMap.get(o.restaurantId) || { totalOrders: 0, revenue: 0 };
    existing.totalOrders += 1;
    if (o.status === "delivered") existing.revenue += o.totalAmount;
    rMap.set(o.restaurantId, existing);
  }
  const sorted = Array.from(rMap.entries()).sort((a, b) => b[1].totalOrders - a[1].totalOrders).slice(0, 10);
  const result = await Promise.all(sorted.map(async ([restaurantId, stats]) => {
    const [r] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId));
    return { id: restaurantId, name: r?.name || "", totalOrders: stats.totalOrders, revenue: Math.round(stats.revenue * 100) / 100, avgRating: null, image: r?.image || null };
  }));
  res.json(result);
});

router.get("/analytics/orders-chart", authenticate, requireRole("admin", "restaurant_owner"), async (req: AuthRequest, res) => {
  const days = parseInt(req.query.days as string) || 14;
  const orders = await db.select().from(ordersTable);
  const map = new Map<string, { orders: number; revenue: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 });
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (map.has(key)) {
      const entry = map.get(key)!;
      entry.orders += 1;
      if (o.status === "delivered") entry.revenue += o.totalAmount;
    }
  }
  res.json(Array.from(map.entries()).map(([date, v]) => ({ date, orders: v.orders, revenue: Math.round(v.revenue * 100) / 100 })));
});

export default router;
