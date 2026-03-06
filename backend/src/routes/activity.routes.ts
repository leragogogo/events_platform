import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { logActivity, getActivityFeed, getActivitiesByUserId } from "../controllers/activity.controller.js";

const router = Router();

router.get("/feed", authMiddleware, getActivityFeed);
router.get("/user/:userId", getActivitiesByUserId);

router.post("/", authMiddleware, logActivity);

export default router;
