import type { Request, Response, NextFunction } from "express";
import jwtMiddleware from "./jwt.js";

export const authenticateJWT = jwtMiddleware.authenticateJWT;
export const generateToken = jwtMiddleware.generateToken;

export const authorizeRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user && (req as any).user.role === role) {
      next();
    } else {
      return res.status(403).json({ success: false, message: "Forbidden - Access Denied" });
    }
  };
};

const middleware = {
  authenticateJWT,
  generateToken,
  authorizeRole,
};

export default middleware;  