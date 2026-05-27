import express from 'express';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';
import {
  createWorkspace,
  getSingleWorkspace,
  getWorkspace,
} from '../controller/workspaceController.js';

const router = express.Router();

router.post(
  '/create',
  verifyToken,
  authorizeRoles('manager', 'admin'),
  createWorkspace,
);

router.get('/', verifyToken, getWorkspace);

router.get('/:id', verifyToken, getSingleWorkspace);

export default router;
