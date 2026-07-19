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

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/task', taskRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

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
