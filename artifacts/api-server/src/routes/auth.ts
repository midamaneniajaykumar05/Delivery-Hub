import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, JWT_SECRET, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name, email, passwordHash,
    phone: phone || null,
    role: role || "customer",
  }).returning();
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() }
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: "email and password are required" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() }
  });
});

router.post("/auth/logout", (_req, res) => { res.json({ success: true }); });

router.get("/auth/me", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() });
});

router.patch("/auth/me/profile", authenticate, async (req: AuthRequest, res) => {
  const { name, phone } = req.body;
  const [user] = await db.update(usersTable).set({ name, phone }).where(eq(usersTable.id, req.user!.id)).returning();
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() });
});

export default router;
