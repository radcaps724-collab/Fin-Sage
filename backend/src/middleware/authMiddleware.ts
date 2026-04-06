import type { NextFunction, RequestHandler, Response } from "express";
import jwt, { type JwtPayload as JsonWebTokenPayload } from "jsonwebtoken";
import env from "../config/env";
import User from "../models/User";
import type { AppJwtPayload, AuthenticatedRequest } from "../types";

const isJwtPayload = (
  value: string | JsonWebTokenPayload
): value is JsonWebTokenPayload & AppJwtPayload =>
  typeof value !== "string" && typeof value.userId === "string";

export const protect: RequestHandler = async (
  req,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: token required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (!isJwtPayload(decoded)) {
      res.status(401).json({ message: "Unauthorized: invalid token" });
      return;
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: "Unauthorized: user not found" });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};
