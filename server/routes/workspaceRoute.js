import express from 'express';
import { authorizeRoles, verifyToken } from '../middleware/authMiddleware.js';
import {
  createWorkspace,
  deleteWorkspace,
  getDashboard,
  getSingleWorkspace,
  getWorkspace,
  getWorkspaceMembers,
  inviteMember,
  leaveWorkspace,
  removeMember,
  updateWorkspace,
} from '../controller/workspaceController.js';

const router = express.Router();

router.get('/dashboard', verifyToken, getDashboard);

router.post(
  '/create',
  verifyToken,
  authorizeRoles('manager', 'admin'),
  createWorkspace,
);

router.get('/', verifyToken, getWorkspace);

router.get('/:workspaceId', verifyToken, getSingleWorkspace);

router.delete(
  '/:workspaceId',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  deleteWorkspace,
);
router.patch(
  '/:workspaceId',
  verifyToken,
  authorizeRoles('admin', 'manager'),
  updateWorkspace,
);

router.delete('/:workspaceId/leave', verifyToken, leaveWorkspace);

//member management route
router.post(
  '/:workspaceId/members',
  verifyToken,
  authorizeRoles('manager', 'admin'),
  inviteMember,
);

router.get('/:workspaceId/members', verifyToken, getWorkspaceMembers);

router.delete(
  '/:workspaceId/members/:userId',
  verifyToken,
  authorizeRoles('manager', 'admin'),
  removeMember,
);

export default router;
