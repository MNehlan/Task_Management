import dns from 'node:dns/promises'
dns.setServers(["8.8.8.8", "1.1.1.1"]); 


import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

// Route imports
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { verifyToken } from './middlewares/authMiddleware.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middlewares
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', verifyToken, workspaceRoutes);
app.use('/api/task', verifyToken, taskRoutes);

// Admin Routes
app.use('/api/admin', verifyToken, adminRoutes);

app.use(errorMiddleware)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Mongodb Connected');
    app.listen(PORT, () => {
      console.log(`server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
