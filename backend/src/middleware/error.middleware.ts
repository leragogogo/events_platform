import { Request, Response, NextFunction } from "express";

/**
 * Express error shape
 */
interface HttpError extends Error {
  status?: number;
}

/**
 * Global error-handling middleware.
 *
 * Any route or middleware that calls `next(err)` will end up here.
 *
 * @example
 * // In a route handler:
 * const err = new Error("Not found") as HttpError;
 * err.status = 404;
 * next(err);
 */
export function errorMiddleware(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const message = err.message ?? "Internal Server Error";
  res.status(status).json({ message });
}
