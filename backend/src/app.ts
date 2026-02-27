import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import eventsRoutes from "./routes/events.routes.js";
/*import usersRoutes from "./routes/users.routes.js";
import registrationsRoutes from "./routes/registrations.routes.js";
import connectionsRoutes from "./routes/connections.routes.js";
import activityRoutes from "./routes/activity.routes.js";*/

import { errorMiddleware } from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventsRoutes);
  /*app.use("/api/users", usersRoutes);
  app.use("/api/registrations", registrationsRoutes);
  app.use("/api/connections", connectionsRoutes);
  app.use("/api/activity", activityRoutes);*/

  app.use(errorMiddleware);
  return app;
}