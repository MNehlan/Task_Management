import express from 'express';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';
import { getAdminDashboard } from '../controller/adminController.js';

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('admin'), getAdminDashboard);

export default router;
