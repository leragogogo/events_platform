import { Request, Response, NextFunction } from "express";
import { Event, EVENT_CATEGORIES } from "../models/Event.js";
import { Activity, ACTIVITY_TTL_DAYS } from "../models/Activity.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const UPDATABLE_FIELDS = [
  "title", "description", "category", "dateTime",
  "address", "city", "coordinates", "capacity",
] as const;

/**
 * Validates event fields for creation. Returns a map of field and reason strings,
 * or null if all fields are valid.
 */
function validateEventFields(body: Record<string, unknown>): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    errors.title = "Title is required";
  }
  if (!body.description || typeof body.description !== "string" || !body.description.trim()) {
    errors.description = "Description is required";
  }
  if (!body.category || !EVENT_CATEGORIES.includes(body.category as string)) {
    errors.category = `Category must be one of: ${EVENT_CATEGORIES.join(", ")}`;
  }
  if (!body.dateTime) {
    errors.dateTime = "dateTime is required";
  } else {
    const dt = new Date(body.dateTime as string);
    if (isNaN(dt.getTime())) {
      errors.dateTime = "dateTime must be a valid date";
    } else if (dt <= new Date()) {
      errors.dateTime = "dateTime must be in the future";
    }
  }
  if (!body.address || typeof body.address !== "string" || !body.address.trim()) {
    errors.address = "Address is required";
  }
  if (!body.city || typeof body.city !== "string" || !body.city.trim()) {
    errors.city = "City is required";
  }
  if (
    !Array.isArray(body.coordinates) ||
    body.coordinates.length !== 2 ||
    !body.coordinates.every((n) => typeof n === "number")
  ) {
    errors.coordinates = "Coordinates must be an array of exactly 2 numbers [lon, lat]";
  }
  if (
    body.capacity === undefined ||
    !Number.isInteger(body.capacity) ||
    (body.capacity as number) < 1
  ) {
    errors.capacity = "Capacity must be an integer >= 1";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * GET /api/events. Return all events with optional filters (auth required).
 * Query params: category, dateFrom (ISO), dateTo (ISO)
 * Selects only fields needed for map markers.
 */
export async function getAllEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;

    if (dateFrom || dateTo) {
      const dt: Record<string, Date> = {};
      if (dateFrom) dt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dt.$lte = end;
      }
      filter.dateTime = dt;
    }

    const events = await Event.find(filter)
      .select("title dateTime city category coordinates")

    res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
}

/** POST /api/events. Create a new event (auth required) */
export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validateEventFields(req.body);
    if (errors) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const { title, description, category, dateTime, address, city, coordinates, capacity } = req.body;
    const { userId } = (req as AuthRequest).user;

    const event = await Event.create({
      title,
      description,
      category,
      dateTime,
      address,
      city,
      coordinates,
      capacity,
      createdByUserId: userId,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ACTIVITY_TTL_DAYS);
    Activity.create({ actorId: userId, type: "created", eventId: event._id, expiresAt }).catch(() => {});

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

/** GET /api/events/meta/categories. Return list of valid categories (public) */
export function getCategories(_req: Request, res: Response): void {
  res.status(200).json({ categories: EVENT_CATEGORIES });
}

/** GET /api/events/:id. Get a single event by id (public) */
export async function getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
}

/** GET /api/events/user/:userId. Get all events created by a user (public) */
export async function getEventsByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await Event.find({ createdByUserId: req.params.userId });
    res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/events/:id/:field. Update a single field (auth required, owner only) */
export async function updateEventField(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const field = req.params.field as string;
    if (!(UPDATABLE_FIELDS as readonly string[]).includes(field)) {
      res.status(400).json({ message: `Field "${field}" cannot be updated. Allowed fields: ${UPDATABLE_FIELDS.join(", ")}` });
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const { userId } = (req as AuthRequest).user;
    if (event.createdByUserId.toString() !== userId) {
      res.status(403).json({ message: "Forbidden: you are not the owner of this event" });
      return;
    }

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: { [field]: req.body.value } },
      { new: true, runValidators: true }
    );

    res.status(200).json({ event: updated });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/events/:id. Delete an event (auth required, owner only) */
export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const { userId } = (req as AuthRequest).user;
    if (event.createdByUserId.toString() !== userId) {
      res.status(403).json({ message: "Forbidden: you are not the owner of this event" });
      return;
    }

    await Event.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
