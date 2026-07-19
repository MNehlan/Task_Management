import express from 'express';
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

router.use(authorizeRoles('admin'));

// Dashboard
router.get('/', getAdminDashboard);

// Workspaces
router.get('/workspaces', getAllWorkspaces);
router.get('/workspaces/:workspaceId', getWorkspaceById);

// Tasks
router.get('/tasks', getAllTasks);
router.get('/tasks/:taskId', getTaskById);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

export default router;
