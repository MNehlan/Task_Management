import express from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/authMiddleware.js';
import {
  getAdminDashboard,
  getAllWorkspaces,
  getWorkspaceById,
  getAllTasks,
  getTaskById,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/adminController.js';

const router = express.Router();

// Dashboard
router.get('/', verifyToken, authorizeRoles('admin'), getAdminDashboard);

// Workspaces
router.get(
  '/workspaces',
  verifyToken,
  authorizeRoles('admin'),
  getAllWorkspaces,
);
router.get(
  '/workspaces/:workspaceId',
  verifyToken,
  authorizeRoles('admin'),
  getWorkspaceById,
);

// Tasks
router.get('/tasks', verifyToken, authorizeRoles('admin'), getAllTasks);
router.get('/tasks/:taskId', verifyToken, authorizeRoles('admin'), getTaskById);

// Users
router.get('/users', verifyToken, authorizeRoles('admin'), getAllUsers);
router.patch(
  '/users/:userId/role',
  verifyToken,
  authorizeRoles('admin'),
  updateUserRole,
);
router.delete(
  '/users/:userId',
  verifyToken,
  authorizeRoles('admin'),
  deleteUser,
);

export default router;
