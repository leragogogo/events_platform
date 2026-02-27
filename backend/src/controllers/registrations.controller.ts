import { Request, Response, NextFunction } from "express";
import { Registration } from "../models/Registration.js";
import { Event } from "../models/Event.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

/** POST /api/registrations. Register the authenticated user for an event. */
export async function createRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      res.status(400).json({ message: "eventId is required" });
      return;
    }

    const { userId } = (req as AuthRequest).user;

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const existing = await Registration.findOne({ eventId, userId });
    if (existing) {
      res.status(409).json({ message: "Already registered for this event" });
      return;
    }

    const count = await Registration.countDocuments({ eventId });
    if (count >= event.capacity) {
      res.status(409).json({ message: "Event is at full capacity" });
      return;
    }

    const registration = await Registration.create({ userId, eventId });
    res.status(201).json({ registration });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/registrations/:id. Cancel a registration (owner only). */
export async function cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      res.status(404).json({ message: "Registration not found" });
      return;
    }

    const { userId } = (req as AuthRequest).user;
    if (registration.userId.toString() !== userId) {
      res.status(403).json({ message: "Forbidden: you do not own this registration" });
      return;
    }

    await Registration.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
