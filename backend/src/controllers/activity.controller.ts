import { Request, Response, NextFunction } from "express";
import { Activity, ACTIVITY_TYPES, ACTIVITY_TTL_DAYS } from "../models/Activity.js";
import { Connection } from "../models/Connection.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

/** POST /api/activity. Log an activity for the authenticated user. */
export async function logActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, eventId } = req.body;

    if (!type || !(ACTIVITY_TYPES as readonly string[]).includes(type)) {
      res.status(400).json({ message: `type must be one of: ${ACTIVITY_TYPES.join(", ")}` });
      return;
    }
    if (!eventId) {
      res.status(400).json({ message: "eventId is required" });
      return;
    }

    const actorId = (req as AuthRequest).user.userId;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ACTIVITY_TTL_DAYS);

    const activity = await Activity.create({ actorId, type, eventId, expiresAt });
    res.status(201).json({ activity });
  } catch (err) {
    next(err);
  }
}

/** GET /api/activity/feed. Get recent activities from the current user's connections. */
export async function getActivityFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.userId;

    const connections = await Connection.find({
      $or: [{ requesterId: userId }, { addresseeId: userId }],
      status: "approved",
    });

    const connectedUserIds = connections.map((c) =>
      c.requesterId.toString() === userId
        ? c.addresseeId.toString()
        : c.requesterId.toString()
    );

    const activities = await Activity.find({ actorId: { $in: connectedUserIds } })
      .sort({ createdAt: -1 });

    res.status(200).json({ activities });
  } catch (err) {
    next(err);
  }
}

/** GET /api/activity/user/:userId. Get recent public activities for a user's profile. */
export async function getActivitiesByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activities = await Activity.find({ actorId: req.params.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({ activities });
  } catch (err) {
    next(err);
  }
}
