import type { Request, Response } from "express";
import logsService from "./logsService.js";

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

const handleError = (res: Response, error: any): Response => {
  console.error("Error:", error);

  if (error.message === "Unauthorized") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (error.message === "Forbidden") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (error.message === "Not found") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  if (error.message === "Validation error") {
    return res.status(400).json({ success: false, message: error.details || "Validation failed" });
  }

  if (error instanceof SyntaxError) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }

  return res.status(500).json({ success: false, message: error.message || "Internal server error" });
};

export const getLogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await logsService.getLogs(limit);
    return sendSuccess(res, { logs }, "Logs retrieved");
  } catch (error) {
    return handleError(res, error);
  }
};

const logsControllers = { getLogs };
export default logsControllers;
