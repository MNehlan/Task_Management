import express from 'express';
import { registerUser, loginUser, getMe } from '../controller/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', verifyToken, getMe);

export default router;
