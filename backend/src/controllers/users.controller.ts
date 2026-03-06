import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Connection } from "../models/Connection.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

/** GET /api/users/me. Return the authenticated user's full profile. */
export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.userId;

    const [user, createdEvents, registrations] = await Promise.all([
      User.findById(userId).select("-passwordHash"),
      Event.find({ createdByUserId: userId }),
      Registration.find({ userId }).populate("eventId"),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const participatedEvents = registrations.map((r) => r.eventId);

    res.status(200).json({ user, createdEvents, participatedEvents });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/users/me/name. Update the authenticated user's name. */
export async function updateMyName(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "name must be a non-empty string" });
      return;
    }

    const userId = (req as AuthRequest).user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { name: name.trim() } },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/users/me/password. Update the authenticated user's password. */
export async function updateMyPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { password } = req.body;

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ message: "password must be at least 6 characters" });
      return;
    }

    const userId = (req as AuthRequest).user.userId;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { passwordHash } },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

/** GET /api/users/:id. Return another user's profile. */
export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const targetId = req.params.id;
    const requesterId = (req as AuthRequest).user.userId;

    const user = await User.findById(targetId).select("-passwordHash -email");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let isConnected = false;
    if (requesterId !== targetId) {
      const [userLowId, userHighId] = [requesterId, targetId].sort();
      const connection = await Connection.findOne({ userLowId, userHighId, status: "approved" });
      isConnected = !!connection;
    }

    if (isConnected) {
      const [createdEvents, registrations] = await Promise.all([
        Event.find({ createdByUserId: targetId }),
        Registration.find({ userId: targetId }).populate("eventId"),
      ]);

      const participatedEvents = registrations.map((r) => r.eventId);
      res.status(200).json({ user, createdEvents, participatedEvents });
    } else {
      const [createdEventsCount, participatedEventsCount] = await Promise.all([
        Event.countDocuments({ createdByUserId: targetId }),
        Registration.countDocuments({ userId: targetId }),
      ]);

      res.status(200).json({ user, createdEventsCount, participatedEventsCount });
    }
  } catch (err) {
    next(err);
  }
}
