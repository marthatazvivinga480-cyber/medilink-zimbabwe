import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

type Payload = {
  id: string;
  role:
    | "patient"
    | "doctor"
    | "pharmacy"
    | "admin";
  email: string;
};

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  try {
    const token = header.slice(7);

    const payload = jwt.verify(
      token,
      env.jwtSecret
    ) as Payload;

    req.user = payload;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

export function requireRole(
  ...roles: Payload["role"][]
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (
      !req.user ||
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        message:
          "You do not have permission for this action.",
      });
    }

    next();
  };
}