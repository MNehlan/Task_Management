import validator from 'validator';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getDashboard = catchAsync(async (req, res) => {
  const workspaces = await Workspace.find({
    members: req.user.id,
  });

  const workspaceIds = workspaces.map((workspace) => workspace._id);

  const tasks = await Task.find({
    workspace: {
      $in: workspaceIds,
    },
  });

  const completed = tasks.filter(
    (task) => task.status === 'Completed',
  ).length;

  const todo = tasks.filter((task) => task.status === 'Todo').length;

  const inProgress = tasks.filter(
    (task) => task.status === 'In Progress',
  ).length;

  const review = tasks.filter((task) => task.status === 'Review').length;

  return res.status(200).json({
    success: true,
    stats: {
      workspaces: workspaces.length,
      tasks: tasks.length,
      todo,
      inProgress,
      review,
      completed,
    },
  });
});

export const createWorkspace = catchAsync(async (req, res) => {
  let { name, description } = req.body;

  if (!name || !description) {
    throw new AppError('All fields required', 400);
  }

  name = name.trim();
  description = description.trim();

  if (validator.isEmpty(name) || validator.isEmpty(description)) {
    throw new AppError('All fields required', 400);
  }

  const existingWorkspace = await Workspace.findOne({
    name,
    owner: req.user.id,
  });

  if (existingWorkspace) {
    throw new AppError('Workspace already exists', 409);
  }

  const workspace = await Workspace.create({
    name,
    description,
    owner: req.user.id,
    members: [req.user.id],
  });

  res.status(201).json({
    success: true,
    workspace,
    message: 'Workspace created successfully',
  });
});

export const getWorkspace = catchAsync(async (req, res) => {
  const workspaces = await Workspace.find({ members: req.user.id });

  res.status(200).json({ success: true, workspaces });
});

export const getSingleWorkspace = catchAsync(async (req, res) => {
  const workspace = await Workspace.findById(req.params.workspaceId);

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const isMember = workspace.members.some(
    (member) => member.toString() === req.user.id,
  );

  if (!isMember) {
    throw new AppError('Access denied', 403);
  }

  res.status(200).json({ success: true, workspace });
});

export const deleteWorkspace = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const canDelete =
    req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
  if (!canDelete) {
    throw new AppError('Access denied', 403);
  }

  await Task.deleteMany({ workspace: workspaceId });
  await workspace.deleteOne();
  res
    .status(200)
    .json({ success: true, message: 'Workspace deleted successfully' });
});

export const updateWorkspace = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;
  const { name, description } = req.body;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const canUpdate =
    req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
  if (!canUpdate) {
    throw new AppError('Access denied', 403);
  }

  const noChange =
    (!name || name.trim() === workspace.name) &&
    (!description || description.trim() === workspace.description);

  if (noChange) {
    throw new AppError('No changes detected', 400);
  }

  if (name) workspace.name = name.trim();
  if (description) workspace.description = description.trim();

  await workspace.save();

  res.status(200).json({
    success: true,
    workspace: {
      id: workspace._id,
      name: workspace.name,
      description: workspace.description,
    },
    message: 'Workspace updated successfully',
  });
});

export const leaveWorkspace = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const isMember = workspace.members.some(
    (member) => member.toString() === req.user.id,
  );
  if (!isMember) {
    throw new AppError('Not a member of this workspace', 404);
  }

  if (workspace.owner?.toString() === req.user.id) {
    throw new AppError('Owner cannot leave', 409);
  }

  const activeTasks = await Task.countDocuments({
    workspace: workspaceId,
    assignedTo: req.user.id,
    status: { $ne: 'Completed' },
  });

  if (activeTasks > 0) {
    throw new AppError(
      'Complete or reassign your active tasks before leaving the workspace',
      409,
    );
  }

  workspace.members = workspace.members.filter(
    (member) => member.toString() !== req.user.id,
  );
  await workspace.save();

  res.status(200).json({ success: true, message: 'You left the workspace' });
});

// member management
export const inviteMember = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;
  let { email } = req.body;
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  email = email.trim().toLowerCase();

  if (!validator.isEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const canInvite =
    req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
  if (!canInvite) {
    throw new AppError('Access denied', 403);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMember = workspace.members.some(
    (member) => member.toString() === user._id.toString(),
  );
  if (isMember) {
    throw new AppError('User is already a member', 409);
  }

  workspace.members.push(user._id);
  await workspace.save();
  res.status(200).json({
    success: true,
    member: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: 'User added',
  });
});

export const getWorkspaceMembers = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId).populate(
    'members',
    'name email role',
  );
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const canView =
    req.user.role === 'admin' ||
    workspace.members.some((member) => member._id.toString() === req.user.id);
  if (!canView) {
    throw new AppError('Access denied', 403);
  }

  res.status(200).json({ success: true, members: workspace.members });
});

export const removeMember = catchAsync(async (req, res) => {
  const { workspaceId, userId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const canRemove =
    req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
  if (!canRemove) {
    throw new AppError('Access denied', 403);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (workspace.owner?.toString() === userId) {
    throw new AppError('Owner cannot be removed', 400);
  }

  const isMember = workspace.members.some(
    (member) => member.toString() === userId,
  );
  if (!isMember) {
    throw new AppError('User is not a member', 409);
  }

  workspace.members = workspace.members.filter(
    (member) => member.toString() !== userId,
  );
  await workspace.save();

  res.status(200).json({ success: true, message: 'Member removed' });
});
