import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { AuditLog } from "../models/AuditLog.js";
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = randomUUID();
  const entityType = req.path.split("/").filter(Boolean)[0] || "api";
  res.setHeader("X-Request-ID", requestId);
  // API responses can contain health and financial information.
  res.setHeader("Cache-Control", "no-store");
  res.once("finish", () => {
    if (!req.user || !["POST", "PATCH", "PUT", "DELETE"].includes(req.method) || res.statusCode >= 400) return;
    // Store route templates, never bodies, tokens, prescription codes or clinical notes.
    const route = req.route?.path;
    void AuditLog.create({ actorUserId: req.user.id, action: req.method, entityType, entityId: typeof req.params.id === "string" ? req.params.id : undefined, metadata: { requestId, route: typeof route === "string" ? route : "unknown", status: res.statusCode, role: req.user.role } }).catch(() => console.error(JSON.stringify({ event: "audit_write_failed", requestId })));
  });
  next();
}
