import express from 'express';
import { authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskByWorkspace,
  updateTask,
  updateTaskStatus,
} from '../controllers/taskController.js';

const router = express.Router();

router.post('/create', authorizeRoles('manager', 'admin'), createTask);

router.get('/workspace/:workspaceId', getTaskByWorkspace);

router.patch('/:taskId', updateTaskStatus);

router.get('/:taskId', getTaskById);

router.put('/:taskId', authorizeRoles('manager', 'admin'), updateTask);

router.delete('/:taskId', authorizeRoles('manager', 'admin'), deleteTask);

export default router;
