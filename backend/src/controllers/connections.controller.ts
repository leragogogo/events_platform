import { Request, Response, NextFunction } from "express";
import { Connection } from "../models/Connection.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

/** POST /api/connections. Send a connection request to another user. */
export async function initiateConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { addresseeId } = req.body;
    if (!addresseeId) {
      res.status(400).json({ message: "addresseeId is required" });
      return;
    }

    const requesterId = (req as AuthRequest).user.userId;

    // Ensure uniqueness regardless of who initiates
    const [userLowId, userHighId] = [requesterId, addresseeId].sort();

    const existing = await Connection.findOne({ userLowId, userHighId });
    if (existing) {
      res.status(409).json({ message: "Connection already exists" });
      return;
    }

    const connection = await Connection.create({
      requesterId,
      addresseeId: addresseeId,
      userLowId,
      userHighId,
    });

    res.status(201).json({ connection });
  } catch (err) {
    next(err);
  }
}

/** GET /api/connections. Fetch all connections for the authenticated user. */
export async function getMyConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user.userId;

    const connections = await Connection.find({
      $or: [{ requesterId: userId }, { addresseeId: userId }],
    })
      .populate("requesterId", "name")
      .populate("addresseeId", "name");

    res.status(200).json({ connections });
  } catch (err) {
    next(err);
  }
}

/** GET /api/connections/user/:userId. Fetch approved connections for a public profile. */
export async function getConnectionsByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;

    const connections = await Connection.find({
      $or: [{ requesterId: userId }, { addresseeId: userId }],
      status: "approved",
    });

    res.status(200).json({ connections });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/connections/:id. Approve or decline a pending connection request. */
export async function updateConnectionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    if (status !== "approved" && status !== "declined") {
      res.status(400).json({ message: "status must be 'approved' or 'declined'" });
      return;
    }

    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      res.status(404).json({ message: "Connection not found" });
      return;
    }

    const userId = (req as AuthRequest).user.userId;
    if (connection.addresseeId.toString() !== userId) {
      res.status(403).json({ message: "Forbidden: only the recipient can respond to a connection request" });
      return;
    }

    if (connection.status !== "pending") {
      res.status(409).json({ message: "Connection has already been resolved" });
      return;
    }

    const updated = await Connection.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    res.status(200).json({ updated });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/connections/:id. Remove an approved connection. */
export async function removeConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      res.status(404).json({ message: "Connection not found" });
      return;
    }

    const userId = (req as AuthRequest).user.userId;
    const isParty =
      connection.requesterId.toString() === userId ||
      connection.addresseeId.toString() === userId;

    if (!isParty) {
      res.status(403).json({ message: "Forbidden: you are not part of this connection" });
      return;
    }

    if (connection.status !== "approved") {
      res.status(409).json({ message: "Only approved connections can be removed" });
      return;
    }

    await Connection.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
