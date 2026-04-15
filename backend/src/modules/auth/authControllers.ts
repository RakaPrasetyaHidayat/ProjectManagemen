import type { Request, Response } from "express";
import authService from "./authService.js";

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

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, "Registration successful", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, "Login successful", 200);
  } catch (error) {
    return handleError(res, error);
  }
};

const authControllers = { register, login };
export default authControllers;