import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getMyProfile, updateMyName, updateMyPassword, getUserProfile } from "../controllers/users.controller.js";

const router = Router();

router.get("/me", authMiddleware, getMyProfile);
router.patch("/me/name", authMiddleware, updateMyName);
router.patch("/me/password", authMiddleware, updateMyPassword);

router.get("/:id", authMiddleware, getUserProfile);

export default router;
