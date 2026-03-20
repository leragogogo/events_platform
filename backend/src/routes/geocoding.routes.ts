import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { geocode } from "../controllers/geocoding.controller.js";

const router = Router();

router.get("/", authMiddleware, geocode);

export default router;
