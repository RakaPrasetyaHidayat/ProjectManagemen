import type { Request, Response } from "express";
import notesService from "./notesService.js";

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

  return sendError(res, error.message || "Internal server error", 500);
};

export const getAllNotes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const user = (req as any).user;

    const data = await notesService.getAllNotes(page, limit, user.id);
    return sendSuccess(res, data, "Notes fetched successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getNoteById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = await notesService.getNoteById(id);
    if (!data) {
      return sendError(res, "Note not found", 404);
    }
    return sendSuccess(res, data, "Note fetched successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const user = (req as any).user;

    if (!content || !content.trim()) {
      return sendError(res, "Content is required", 400);
    }

    const data = await notesService.createNote(content, user.id);
    return sendSuccess(res, data, "Note created successfully", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { content } = req.body;
    const user = (req as any).user;

    if (!content || !content.trim()) {
      return sendError(res, "Content is required", 400);
    }

    const data = await notesService.updateNote(id, content, user.id);
    return sendSuccess(res, data, "Note updated successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const user = (req as any).user;

    await notesService.deleteNote(id, user.id);
    return sendSuccess(res, null, "Note deleted successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

const notesControllers = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
};

export default notesControllers;
