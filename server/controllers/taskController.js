import validator from 'validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

// Shared Task DTO — every endpoint that returns a task uses this
const toTaskDTO = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  priority: task.priority,
  deadline: task.deadline,
  status: task.status,
  assignedTo: task.assignedTo
    ? {
        id: task.assignedTo._id,
        name: task.assignedTo.name,
        email: task.assignedTo.email,
        role: task.assignedTo.role,
      }
    : null,
  createdBy: task.createdBy
    ? {
        id: task.createdBy._id,
        name: task.createdBy.name,
        email: task.createdBy.email,
      }
    : {
        id: null,
        name: 'Deleted User',
        email: 'deleted@workspace.com',
      },
  workspace: task.workspace
    ? {
        id: task.workspace._id,
        name: task.workspace.name,
      }
    : {
        id: null,
        name: 'Deleted Workspace',
      },
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

export const createTask = catchAsync(async (req, res) => {
  let { title, description, priority, deadline, workspaceId, assignedTo } =
    req.body;

  if (!title || !description || !deadline || !workspaceId) {
    throw new AppError('All fields required', 400);
  }

  if (typeof title !== 'string' || typeof description !== 'string') {
    throw new AppError('Title and description must be text strings', 400);
  }

  title = title.trim();
  description = description.trim();

  if (validator.isEmpty(title) || validator.isEmpty(description)) {
    throw new AppError('All fields required', 400);
  }

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const canCreate =
    req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
  if (!canCreate) {
    throw new AppError('Access denied', 403);
  }

  if (assignedTo) {
    const user = await User.findById(assignedTo);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMember = workspace.members.some(
      (member) => member.toString() === assignedTo,
    );

    if (!isMember) {
      throw new AppError('User is not a member of this workspace', 400);
    }
  }

  const task = await Task.create({
    title,
    description,
    priority,
    deadline,
    workspace: workspaceId,
    assignedTo,
    createdBy: req.user.id,
  });

  await task.populate('assignedTo', 'name email role');
  await task.populate('createdBy', 'name email');
  await task.populate('workspace', 'name');

  res.status(201).json({
    success: true,
    task: toTaskDTO(task),
    message: 'Task created successfully',
  });
});

export const getTaskByWorkspace = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  if (req.user.role !== 'admin') {
    const isMember = workspace.members.some(
      (member) => member.toString() === req.user.id,
    );
    if (!isMember) {
      throw new AppError('User is not a member of this workspace', 403);
    }
  }

  const tasks = await Task.find({ workspace: workspaceId })
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .populate('workspace', 'name');

  res.status(200).json({
    success: true,
    tasks: tasks.map(toTaskDTO),
  });
});

export const updateTaskStatus = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const validStatus = ['Todo', 'In Progress', 'Review', 'Completed'];

  if (!validStatus.includes(status)) {
    throw new AppError('Not a valid status', 400);
  }

  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .populate('workspace', 'name owner members');

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (!task.workspace) {
    throw new AppError('Workspace associated with this task not found or deleted', 404);
  }

  const isMember =
    req.user.role === 'admin' ||
    task.workspace.members.some((member) => member.toString() === req.user.id);

  if (!isMember) {
    throw new AppError('Access denied', 403);
  }

  const canUpdate =
    req.user.role === 'admin' ||
    task.workspace.owner?.toString() === req.user.id ||
    task.assignedTo?._id?.toString() === req.user.id;

  if (!canUpdate) {
    throw new AppError('Not authorized to update task status', 403);
  }

  task.status = status;
  await task.save();

  res.status(200).json({
    success: true,
    task: toTaskDTO(task),
    message: 'Task status updated successfully',
  });
});

export const getTaskById = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .populate('workspace', 'name members');

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (!task.workspace) {
    throw new AppError('Workspace associated with this task not found or deleted', 404);
  }

  const canView =
    req.user.role === 'admin' ||
    task.workspace.members.some((member) => member.toString() === req.user.id);

  if (!canView) {
    throw new AppError('Access denied', 403);
  }

  res.status(200).json({
    success: true,
    task: toTaskDTO(task),
  });
});

export const updateTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const { title, description, priority, deadline, assignedTo } = req.body;

  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .populate('workspace', 'name owner members');

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (!task.workspace) {
    throw new AppError('Workspace associated with this task not found or deleted', 404);
  }

  const canEdit =
    req.user.role === 'admin' ||
    task.workspace.owner?.toString() === req.user.id;

  if (!canEdit) {
    throw new AppError('Not authorized', 403);
  }

  if (assignedTo) {
    const user = await User.findById(assignedTo);

    if (!user) {
      throw new AppError('Assigned user not found', 404);
    }

    const isMember = task.workspace.members.some(
      (member) => member.toString() === assignedTo,
    );

    if (!isMember) {
      throw new AppError('User is not a member of this workspace', 400);
    }

    task.assignedTo = user._id;
    await task.populate('assignedTo', 'name email role');
  }

  if (deadline) {
    if (isNaN(new Date(deadline))) {
      throw new AppError('Invalid deadline format', 400);
    }
  }

  if (title) task.title = title;
  if (description) task.description = description;
  if (priority) task.priority = priority;
  if (deadline) task.deadline = deadline;

  await task.save();

  res.status(200).json({
    success: true,
    task: toTaskDTO(task),
    message: 'Task updated successfully',
  });
});

export const deleteTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const workspace = await Workspace.findById(task.workspace);

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const canDelete =
    req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;

  if (!canDelete) {
    throw new AppError('Not authorized to delete task', 403);
  }

  await task.deleteOne();
  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});
