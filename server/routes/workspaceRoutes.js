import express from 'express';
import { authorizeRoles } from '../middlewares/authMiddleware.js';
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
} from '../controllers/workspaceController.js';

const router = express.Router();

router.get('/dashboard', getDashboard);

router.post('/create', authorizeRoles('manager', 'admin'), createWorkspace);

router.get('/', getWorkspace);

router.get('/:workspaceId', getSingleWorkspace);

router.delete(
  '/:workspaceId',
  authorizeRoles('admin', 'manager'),
  deleteWorkspace,
);
router.patch(
  '/:workspaceId',
  authorizeRoles('admin', 'manager'),
  updateWorkspace,
);

router.delete('/:workspaceId/leave', leaveWorkspace);

//member management route
router.post(
  '/:workspaceId/members',
  authorizeRoles('manager', 'admin'),
  inviteMember,
);

router.get('/:workspaceId/members', getWorkspaceMembers);

router.delete(
  '/:workspaceId/members/:userId',
  authorizeRoles('manager', 'admin'),
  removeMember,
);

export default router;
