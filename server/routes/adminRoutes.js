import express from 'express';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';
import { getAdminDashboard, getAllWorkspaces } from '../controller/adminController.js';

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('admin'), getAdminDashboard);
router.get('/workspaces', verifyToken, authorizeRoles('admin'), getAllWorkspaces);

export default router;
