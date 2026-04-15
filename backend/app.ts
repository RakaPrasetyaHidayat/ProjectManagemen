import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import authRoutes from "./src/modules/auth/authRoutes.js";
import usersRoutes from "./src/modules/users/usersRoutes.js";
import projectsRoutes from "./src/modules/projects/projectsRoutes.js";
import tasksRoutes from "./src/modules/tasks/tasksRoutes.js";
import logsRoutes from "./src/modules/logs/logsRoutes.js";
import notesRoutes from "./src/modules/notes/notesRoutes.js";
import prisma from "./src/config/config.js";
import type { Request, Response } from "express";

const app = express();
const port = process.env.PORT || 5000;
const nodeEnv = process.env.NODE_ENV || "development";

// Rate limiting: 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per windowMs
  message: {
    success: false,
    message: "Terlalu banyak request dari IP ini, silakan coba lagi dalam beberapa menit.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === "/";
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Terlalu banyak request dari IP ini, silakan coba lagi dalam beberapa menit.",
    });
  },
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (mobile apps, Postman, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }

      const frontendUrl = (process.env.FRONTEND_URL || "https://taskflow-staging-five.vercel.app").replace(/\/+$/, "");
      const cleanOrigin = origin.replace(/\/+$/, "");

      const allowedOrigins = [
        frontendUrl,
        "http://localhost:3000",
        "http://localhost:3001",
      ];

      // Check exact match
      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
        return;
      }

      // Allow ALL Vercel deployment URLs (production + preview)
      if (cleanOrigin.endsWith(".vercel.app")) {
        callback(null, true);
        return;
      }

      console.warn(`CORS denied for origin: ${origin}`);
      callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    maxAge: 86400,
  })
);

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiting to all API routes
app.use("/api/", limiter);

// Static files
app.use("/uploads", express.static("uploads", {
  maxAge: "7d",        
  etag: true,
  lastModified: true,
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/notes", notesRoutes);

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "TaskFlow API is running 🚀",
    version: "1.0.0",
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler (Express requires 4 params to identify error middleware)
app.use((err: any, _req: Request, res: Response, _next: Function) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Start server ONLY if not on Vercel
if (process.env.VERCEL !== "1") {
  const server = app.listen(port, () => {
    console.log(`✅ TaskFlow API running on port ${port} (${nodeEnv})`);
    console.log(`📁 Uploads path: http://localhost:${port}/uploads`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`);
  });

  // Handle server errors
  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} is already in use`);
    } else {
      console.error("❌ Server error:", err);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("⚠️  Shutting down gracefully...");
    server.close(async () => {
      await prisma.$disconnect();
      console.log("✅ Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}


export default app;