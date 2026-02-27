import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createRegistration, cancelRegistration } from "../controllers/registrations.controller.js";

const router = Router();

router.post("/", authMiddleware, createRegistration);
router.delete("/:id", authMiddleware, cancelRegistration);

export default router;
