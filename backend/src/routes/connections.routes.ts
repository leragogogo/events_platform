import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  initiateConnection,
  getMyConnections,
  getConnectionsByUserId,
  updateConnectionStatus,
  removeConnection,
} from "../controllers/connections.controller.js";

const router = Router();

router.get("/user/:userId", getConnectionsByUserId);
router.get("/", authMiddleware, getMyConnections);

router.post("/", authMiddleware, initiateConnection);
router.patch("/:id", authMiddleware, updateConnectionStatus);
router.delete("/:id", authMiddleware, removeConnection);

export default router;
