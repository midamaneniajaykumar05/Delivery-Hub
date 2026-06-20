import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, requireRole } from "../middlewares/auth";

const router = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

router.use("/uploads", (req, res, next) => {
  const filePath = path.join(uploadsDir, path.basename(req.path));
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next();
  }
});

router.post("/upload/image", authenticate, requireRole("restaurant_owner", "admin"), upload.single("image"), (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No image uploaded" }); return; }
  const baseUrl = process.env.FRONTEND_URL || "";
  const url = `${baseUrl}/api/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

export default router;
