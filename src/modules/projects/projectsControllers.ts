import type { Request, Response } from "express";
import projectsService from "./projectsService.js";

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
  console.error("Projects Error:", error);

  if (error.message === "Unauthorized") {
    return sendError(res, "Unauthorized", 401);
  }

  if (error.message === "Forbidden") {
    return sendError(res, "Forbidden", 403);
  }

  if (error.message?.includes("not found") || error.message === "Not found") {
    return sendError(res, error.message || "Not found", 404);
  }

  if (error.message === "Validation error") {
    return sendError(res, error.details || "Validation failed", 400);
  }

  if (error instanceof SyntaxError) {
    return sendError(res, "Invalid request", 400);
  }

  return sendError(res, error.message || "Internal server error", 500);
};


export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const user = (req as any).user;
    const data = await projectsService.getAllProjects(page, limit, user.id, user.role);
    return sendSuccess(res, data, "Projects fetched successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const data = await projectsService.getProjectById(id);
    if (!data) {
      return sendError(res, "Project not found", 404);
    }
    return sendSuccess(res, data, "Project fetched successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "manager") {
      return sendError(res, "Only managers can create projects", 403);
    }
    const data = await projectsService.createProject({ ...req.body, created_by: user.id });
    return sendSuccess(res, data, "Project created successfully", 201);
  } catch (error) {
    return handleError(res, error);
  }
};


export const updateProject = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "manager") {
      return sendError(res, "Only managers can update projects", 403);
    }
    const id = parseInt(req.params.id as string);
    const data = await projectsService.updateProject(id, req.body);
    return sendSuccess(res, data, "Project updated successfully");
  } catch (error) {
    return handleError(res, error);
  }
};


export const deleteProject = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "manager") {
      return sendError(res, "Only managers can delete projects", 403);
    }
    const id = parseInt(req.params.id as string);
    await projectsService.deleteProject(id);
    return sendSuccess(res, null, "Project deleted successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

const projectsControllers = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};

export default projectsControllers;