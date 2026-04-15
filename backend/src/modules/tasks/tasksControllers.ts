import type { Request, Response } from "express";
import tasksService from "./tasksService.js";
import fs from "fs";
import path from "path";

// Response helpers
const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const sendError = (
  res: Response,
  message: string = "Error",
  statusCode: number = 400
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const handleError = (res: Response, error: any): Response => {
  console.error("Error:", error);

  if (error.message === "Unauthorized") {
    return sendError(res, "Unauthorized", 401);
  }

  if (error.message === "Forbidden") {
    return sendError(res, "Forbidden", 403);
  }

  if (error.message === "Not found") {
    return sendError(res, "Not found", 404);
  }

  if (error.message === "Validation error") {
    return sendError(res, error.details || "Validation failed", 400);
  }

  if (error instanceof SyntaxError) {
    return sendError(res, "Invalid request", 400);
  }

  // Predefined business logic errors that should return 400
  const businessErrors = [
    "You can only update status",
    "You can only upload files",
    "You can only delete",
    "Task not found",
    "Cannot manually set status to Overdue",
    "Cannot change status from",
  ];

  if (businessErrors.some(msg => error.message?.includes(msg))) {
    return sendError(res, error.message, 400);
  }

  return sendError(res, error.message || "Internal server error", 500);
};

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const user = (req as any).user;

    const data = await tasksService.getAllTasks(page, limit, status, user.id, user.role, projectId);
    return sendSuccess(res, data, "Tasks fetched successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (!id || isNaN(id)) {
      return sendError(res, "Valid task ID is required", 400);
    }
    const data = await tasksService.getTaskById(id);
    if (!data) {
      return sendError(res, "Task not found", 404);
    }
    return sendSuccess(res, data, "Task fetched successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    if (!req.body.task_name || !req.body.task_project) {
      return sendError(res, "Task name and project ID are required", 400);
    }
    const data = await tasksService.createTask(req.body);
    return sendSuccess(res, data, "Task created successfully", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (!id || isNaN(id)) {
      return sendError(res, "Valid task ID is required", 400);
    }
    const data = await tasksService.updateTask(id, req.body);
    return sendSuccess(res, data, "Task updated successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (!id || isNaN(id)) {
      return sendError(res, "Valid task ID is required", 400);
    }
    await tasksService.deleteTask(id);
    return sendSuccess(res, null, "Task deleted successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (!id || isNaN(id)) {
      return sendError(res, "Valid task ID is required", 400);
    }
    const { status } = req.body;
    if (!status) {
      return sendError(res, "Status is required", 400);
    }
    const user = (req as any).user;
    const data = await tasksService.updateTaskStatus(id, status, user.id, user.role);
    return sendSuccess(res, data, "Task status updated successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const uploadTaskFile = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id as string);
    if (!taskId || isNaN(taskId)) {
      return sendError(res, "Valid task ID is required", 400);
    }
    const file = (req as any).file;
    const user = (req as any).user;
    const { description } = req.body;

    if (!file) {
      return sendError(res, "No file uploaded", 400);
    }

    const data = await tasksService.addFileToTask(
      taskId,
      file.originalname,
      file.path,
      user.id,
      user.role,
      description
    );
    return sendSuccess(res, data, "File uploaded successfully", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const downloadTaskFile = async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId as string);
    if (!fileId || isNaN(fileId)) {
      return sendError(res, "Valid file ID is required", 400);
    }

    const file = await tasksService.getTaskFile(fileId);
    if (!file) {
      return sendError(res, "File not found", 404);
    }

    const getUploadDir = () => {
      const isVercel = process.env.VERCEL === "1";
      return isVercel ? path.join("/tmp", "taskflow-uploads") : "uploads/";
    };

    const uploadDir = getUploadDir();
    // Use the stored file_path basename (multer-generated name) for disk lookup
    const storedFileName = path.basename(file.file_path);
    const filePath = path.join(uploadDir, storedFileName);

    if (!fs.existsSync(filePath)) {
      return sendError(res, "File not found on server", 404);
    }

    // Detect mime type based on extension
    const ext = file.file_type?.toLowerCase() || path.extname(file.file_name).slice(1).toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
      webp: "image/webp",
      gif: "image/gif",
      txt: "text/plain",
      log: "text/plain",
      json: "application/json",
      html: "text/html",
      csv: "text/csv",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xls: "application/vnd.ms-excel",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.file_name}"`
    );
    res.setHeader("Cache-Control", "public, max-age=3600");

    const fileStream = fs.createReadStream(filePath);

    // Handle stream errors BEFORE piping
    fileStream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error streaming file",
        });
      }
      fileStream.destroy();
    });

    // Pipe the file to response
    fileStream.pipe(res);

    // Return nothing - response is handled by stream
    return;
  } catch (error) {
    return handleError(res, error);
  }
};


export const deleteTaskFile = async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId as string);
    if (!fileId || isNaN(fileId)) {
      return sendError(res, "Valid file ID is required", 400);
    }
    const user = (req as any).user;
    await tasksService.deleteTaskFile(fileId, user.id, user.role);
    return sendSuccess(res, null, "File deleted successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

const tasksControllers = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  uploadTaskFile,
  downloadTaskFile,
  deleteTaskFile,
};

export default tasksControllers;