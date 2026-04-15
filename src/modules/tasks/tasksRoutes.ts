import { Router } from "express";
import tasksControllers from "./tasksControllers.js";
import middleware from "../../middleware/middleware.js";
import upload from "../../config/multer.js";

const tasksRoutes = Router();

tasksRoutes.get("/", middleware.authenticateJWT, tasksControllers.getAllTasks);


tasksRoutes.get("/:id", middleware.authenticateJWT, tasksControllers.getTaskById);

tasksRoutes.patch(
  "/:id/status",
  middleware.authenticateJWT,

  tasksControllers.updateTaskStatus
);


tasksRoutes.post(
  "/:id/files",
  middleware.authenticateJWT,
  upload.single("file"),
  tasksControllers.uploadTaskFile
);

tasksRoutes.get(
  "/:taskId/files/:fileId/download",
  middleware.authenticateJWT,
  tasksControllers.downloadTaskFile
);

tasksRoutes.delete(
  "/:id/files/:fileId",
  middleware.authenticateJWT,
  tasksControllers.deleteTaskFile
);

// ─── Manager Only ─────────────────────────────────────────────────────────────
tasksRoutes.post(
  "/",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  tasksControllers.createTask
);


tasksRoutes.put(
  "/:id",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  tasksControllers.updateTask
);

tasksRoutes.delete(
  "/:id",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  tasksControllers.deleteTask
);

export default tasksRoutes;