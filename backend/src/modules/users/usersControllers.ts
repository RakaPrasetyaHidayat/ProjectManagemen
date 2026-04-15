import type { Request, Response } from "express";
import usersService from "./usersService.js";

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

const sendPaginatedSuccess = <T = any>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = "Success",
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
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

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const data = await usersService.getDashboardStats();
    return sendSuccess(res, data, "Dashboard stats retrieved");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as number;
    const data = await usersService.getProfile(userId);
    return sendSuccess(res, data, "Profile retrieved");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { users, total } = await usersService.getAllUsers(page, limit);
    return sendPaginatedSuccess(res, users, total, page, limit, "Users retrieved");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = await usersService.getUserById(id);
    if (!data) {
      return sendError(res, "User not found", 404);
    }
    return sendSuccess(res, data, "User retrieved");
  } catch (error) {
    return handleError(res, error);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const user = await usersService.createUser(data);
    return sendSuccess(res, user, "User created", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = req.body;
    const user = await usersService.updateUser(id, data);
    return sendSuccess(res, user, "User updated");
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await usersService.deleteUser(id);
    return sendSuccess(res, null, "User deleted");
  } catch (error) {
    return handleError(res, error);
  }
};

const usersControllers = {
  getDashboardStats,
  getProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

export default usersControllers;