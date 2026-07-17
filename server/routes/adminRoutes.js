import express from 'express';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';
import { getAdminDashboard, getAllWorkspaces, getWorkspaceById, getAllTasks, getTaskById } from '../controller/adminController.js';

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('admin'), getAdminDashboard);
router.get('/workspaces', verifyToken, authorizeRoles('admin'), getAllWorkspaces);
router.get('/workspaces/:workspaceId', verifyToken, authorizeRoles('admin'), getWorkspaceById);
router.get('/tasks', verifyToken, authorizeRoles('admin'), getAllTasks);
router.get('/tasks/:taskId', verifyToken, authorizeRoles('admin'), getTaskById);

export default router;
