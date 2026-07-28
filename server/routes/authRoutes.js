import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
} from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginLimiter, loginUser);

router.get('/me', verifyToken, getMe);

export default router;
