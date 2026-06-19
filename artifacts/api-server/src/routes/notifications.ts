import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/notifications", authenticate, async (req: AuthRequest, res) => {
  const notifs = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt));
  res.json(notifs.map(n => ({
    id: n.id, userId: n.userId, title: n.title, message: n.message,
    type: n.type, isRead: n.isRead === "true",
    createdAt: n.createdAt.toISOString()
  })));
});

router.patch("/notifications/read", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.body;
  await db.update(notificationsTable).set({ isRead: "true" })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.id)));
  res.json({ success: true });
});

router.patch("/notifications/read-all", authenticate, async (req: AuthRequest, res) => {
  await db.update(notificationsTable).set({ isRead: "true" })
    .where(eq(notificationsTable.userId, req.user!.id));
  res.json({ success: true });
});

export default router;
