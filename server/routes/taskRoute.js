import express from 'express';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskByWorkspace,
  updateTask,
  updateTaskStatus,
} from '../controller/taskController.js';

const router = express.Router();

router.post(
  '/create',
  verifyToken,
  authorizeRoles('manager', 'admin'),
  createTask,
);

router.get('/workspace/:workspaceId', verifyToken, getTaskByWorkspace);

router.patch('/:taskId', verifyToken, updateTaskStatus);

router.get('/:taskId', verifyToken, getTaskById);

router.put(
  '/:taskId',
  verifyToken,
  authorizeRoles('manager', 'admin'),
  updateTask,
);

router.delete(
  '/:taskId',
  verifyToken,
  authorizeRoles('manager', 'admin'),
  deleteTask,
);

export default router;
