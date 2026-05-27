import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import { verifyToken, authorizeRoles } from './middleware/authMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);

app.get('/api/test', verifyToken, authorizeRoles('Admin'), (req, res) => {
  const request = req.user;
  res.status(200).json({ request, message: 'Middleware working' });
});

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