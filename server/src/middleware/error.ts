import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found." });
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);
  if (err instanceof ZodError) {
    // Return validation messages and field paths only, never the submitted values.
    return res.status(400).json({
      message: "Please check your information and try again.",
      errors: err.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })),
    });
  }
  const error = err as { type?: string; name?: string };
  const status = error?.type === "entity.parse.failed" ? 400 : error?.type === "entity.too.large" ? 413 : 500;
  console.error(JSON.stringify({ event: "request_error", requestId: res.getHeader("X-Request-ID"), name: error?.name || "Error", status }));
  res.status(status).json({ message: status === 400 ? "Request body must be valid JSON." : status === 413 ? "Request is too large." : "Something went wrong on the server. Please try again." });
}
