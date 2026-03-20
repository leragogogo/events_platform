import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/search?q=...
 *
 * Case-insensitive search across users (by name) and events (by title).
 * Returns empty arrays without hitting the DB when query is absent or blank.
 */
export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (req.query.q as string | undefined)?.trim() ?? "";
    if (!q) {
      res.status(200).json({ users: [], events: [] });
      return;
    }

    const pattern = new RegExp(escapeRegex(q), "i");
    const [users, events] = await Promise.all([
      User.find({ name: pattern }).select("-passwordHash -email").limit(10),
      Event.find({ title: pattern }).limit(20),
    ]);
    res.status(200).json({ users, events });
  } catch (err) {
    next(err);
  }
}
