import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllEvents,
  createEvent,
  getCategories,
  getEventById,
  getEventsByUserId,
  updateEventField,
  deleteEvent,
} from "../controllers/events.controller.js";

const router = Router();

router.get("/meta/categories", getCategories);
router.get("/user/:userId", getEventsByUserId);
router.get("/", authMiddleware, getAllEvents);

router.get("/:id", getEventById);
router.post("/", authMiddleware, createEvent);
router.patch("/:id/:field", authMiddleware, updateEventField);
router.delete("/:id", authMiddleware, deleteEvent);

export default router;
