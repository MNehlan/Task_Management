import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import { verifyToken } from "./middlewares/authMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

app.use(express.json());

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/workspace", verifyToken, workspaceRoutes);
app.use("/api/task", verifyToken, taskRoutes);
app.use("/api/admin", verifyToken, adminRoutes);

app.use(errorMiddleware);

export default app;
