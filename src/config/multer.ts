import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

// ─── Storage Configuration ──────────────────────────────────────────────────────

// Use /tmp for Vercel (ephemeral) or uploads/ for local development
const getUploadDir = () => {
  const isVercel = process.env.VERCEL === "1";
  return isVercel ? path.join("/tmp", "taskflow-uploads") : "uploads/";
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = getUploadDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const filename = `${timestamp}-${safeName}`;
    cb(null, filename);
  },
});

// ─── Allowed MIME Types ─────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

// ─── File Filter ───────────────────────────────────────────────────────────────

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP, PDF, DOCS, EXCEL, PPT."
      )
    );
  }
};

// ─── Multer Instance ───────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export default upload;