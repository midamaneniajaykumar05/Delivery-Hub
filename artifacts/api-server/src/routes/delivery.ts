import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, restaurantsTable, deliveryPartnersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../middlewares/auth";
import { buildOrderFn } from "./orders-helper";

const router = Router();

router.get("/delivery/orders", authenticate, requireRole("delivery_partner"), async (req: AuthRequest, res) => {
  const orders = await db.select().from(ordersTable)
    .where(or(
      eq(ordersTable.deliveryPartnerId, req.user!.id),
      eq(ordersTable.status, "ready_for_pickup")
    ));
  const data = await Promise.all(orders.map(buildOrderFn));
  res.json(data);
});

router.get("/delivery/earnings", authenticate, requireRole("delivery_partner"), async (req: AuthRequest, res) => {
  const allDelivered = await db.select().from(ordersTable)
    .where(eq(ordersTable.deliveryPartnerId, req.user!.id));
  const delivered = allDelivered.filter(o => o.status === "delivered");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const DELIVERY_FEE = 3.5;
  const totalDeliveries = delivered.length;
  const totalEarnings = totalDeliveries * DELIVERY_FEE;
  const todayDeliveries = delivered.filter(o => o.createdAt >= todayStart).length;
  const weekDeliveries = delivered.filter(o => o.createdAt >= weekStart).length;

  res.json({
    totalDeliveries, totalEarnings: Math.round(totalEarnings * 100) / 100,
    todayEarnings: Math.round(todayDeliveries * DELIVERY_FEE * 100) / 100,
    weekEarnings: Math.round(weekDeliveries * DELIVERY_FEE * 100) / 100,
  });
});

export default router;
