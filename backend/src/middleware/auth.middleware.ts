import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Extends Express's Request with the authenticated user payload.
 */
export interface AuthRequest extends Request {
  user: { userId: string };
}

/** Shape of the JWT payload signed on login/register. */
interface JwtPayload {
  userId: string;
}

/**
 * Verifies the JWT stored in the `token` httpOnly cookie.
 *
 * On success attaches req.user = { userId } and calls next().
 * On missing or invalid token responds with 401.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    (req as AuthRequest).user = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
