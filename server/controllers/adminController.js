import Task from '../models/Task.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getAdminDashboard = catchAsync(async (req, res) => {
  const users = await User.countDocuments();
  const workspaces = await Workspace.countDocuments();
  const tasks = await Task.countDocuments();
  const completed = await Task.countDocuments({ status: 'Completed' });
  const todo = await Task.countDocuments({ status: 'Todo' });
  const inProgress = await Task.countDocuments({ status: 'In Progress' });
  const review = await Task.countDocuments({ status: 'Review' });

  return res.status(200).json({
    success: true,
    stats: { users, workspaces, tasks, todo, inProgress, review, completed },
  });
});

export const getAllWorkspaces = catchAsync(async (req, res) => {
  const workspaces = await Workspace.find()
    .populate('owner', 'name email')
    .lean();

  const workspacesWithStats = await Promise.all(
    workspaces.map(async (ws) => {
      const taskCount = await Task.countDocuments({ workspace: ws._id });
      return {
        id: ws._id,
        name: ws.name,
        description: ws.description,
        owner: {
          id: ws.owner._id,
          name: ws.owner.name,
          email: ws.owner.email,
        },
        memberCount: ws.members.length,
        taskCount,
        createdAt: ws.createdAt,
      };
    }),
  );

  res.status(200).json({ success: true, workspaces: workspacesWithStats });
});

export const getWorkspaceById = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId)
    .populate('owner', 'name email')
    .populate('members', 'name email role')
    .lean();

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const tasks = await Task.find({ workspace: workspaceId })
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .lean();

  res.status(200).json({
    success: true,
    workspace: {
      id: workspace._id,
      name: workspace.name,
      description: workspace.description,
      owner: {
        id: workspace.owner._id,
        name: workspace.owner.name,
        email: workspace.owner.email,
      },
      members: workspace.members.map((m) => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
      })),
      tasks: tasks.map((task) => ({
        id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline,
        assignedTo: task.assignedTo
          ? {
              id: task.assignedTo._id,
              name: task.assignedTo.name,
              email: task.assignedTo.email,
            }
          : null,
        createdBy: {
          id: task.createdBy._id,
          name: task.createdBy.name,
          email: task.createdBy.email,
        },
        createdAt: task.createdAt,
      })),
      createdAt: workspace.createdAt,
    },
  });
});

export const getAllTasks = catchAsync(async (req, res) => {
  const tasks = await Task.find()
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .populate('workspace', 'name')
    .lean();

  res.status(200).json({
    success: true,
    tasks: tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
          }
        : null,
      createdBy: {
        id: task.createdBy._id,
        name: task.createdBy.name,
        email: task.createdBy.email,
      },
      workspace: {
        id: task.workspace._id,
        name: task.workspace.name,
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })),
  });
});

export const getTaskById = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .populate('workspace', 'name')
    .lean();

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.status(200).json({
    success: true,
    task: {
      id: task._id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
          }
        : null,
      createdBy: {
        id: task.createdBy._id,
        name: task.createdBy.name,
        email: task.createdBy.email,
      },
      workspace: {
        id: task.workspace._id,
        name: task.workspace.name,
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    },
  });
});

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password').lean();

  res.status(200).json({
    success: true,
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    })),
  });
});

export const updateUserRole = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (userId === req.user.id) {
    throw new AppError('You cannot change your own role', 400);
  }

  const validRoles = ['member', 'manager', 'admin'];
  if (!validRoles.includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true },
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

export const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({ success: true, message: 'User deleted successfully' });
});
