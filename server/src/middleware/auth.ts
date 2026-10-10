import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

type Role = "patient" | "doctor" | "pharmacy" | "admin";
type Payload = { id: string; role: Role; email: string; sessionVersion?: number };

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  let payload: Payload;
  try {
    const decoded = jwt.verify(header.slice(7), env.jwtSecret, { algorithms: ["HS256"] });
    if (typeof decoded === "string" || typeof decoded.id !== "string" ||
        !/^[a-f0-9]{24}$/i.test(decoded.id) ||
        (decoded.sessionVersion !== undefined && (!Number.isInteger(decoded.sessionVersion) || decoded.sessionVersion < 0))) {
      throw new Error("Invalid token claims");
    }
    payload = decoded as Payload;
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  try {
    const user = await User.findById(payload.id).select("_id role email isActive sessionVersion");
    // Legacy tokens remain valid for untouched accounts (version zero).
    if (!user || user.isActive === false ||
        (payload.sessionVersion ?? 0) !== (user.sessionVersion ?? 0) || user.role !== payload.role) {
      return res.status(401).json({ message: "Your session is no longer valid. Please sign in again." });
    }
    req.user = { id: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch (error) {
    // A database outage is a server error, not an invalid-password response.
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action." });
    }
    next();
  };
}
