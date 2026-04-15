import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// Get JWT secret with fallback for development
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("⚠️  JWT_SECRET not set, using fallback secret");
    return "fallback-secret-key-development-only-change-in-production";
  }
  return secret;
};

const secretKey = getJwtSecret();

export const generateToken = (userId: number, role: string): string => {
  return jwt.sign({ userId, role }, secretKey, { expiresIn: "8h" });
};


export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized – token not found" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized – token not found" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secretKey);

    if (
      typeof decoded === "string" ||
      !("userId" in decoded) ||
      !("role" in decoded)
    ) {
      res.status(403).json({ success: false, message: "Invalid token payload" });
      return;
    }

    
    (req as any).user = {
      id: (decoded as any).userId,
      role: (decoded as any).role,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ success: false, message: "Token expired, please login again" });
      return;
    }
    res.status(403).json({ success: false, message: "Forbidden – invalid token" });
    return;
  }
};

const jwtMiddleware = {
  authenticateJWT,
  generateToken,
};

export default jwtMiddleware;