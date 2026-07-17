import validator from 'validator';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';

export const getDashboard = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createWorkspace = async (req, res) => {
  try {
    let { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields required' });
    }

    name = name.trim();
    description = description.trim();

    if (validator.isEmpty(name) || validator.isEmpty(description)) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields required' });
    }

    const existingWorkspace = await Workspace.findOne({
      name,
      owner: req.user.id,
    });

    if (existingWorkspace) {
      return res
        .status(409)
        .json({ success: false, message: 'Workspace already exists' });
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
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWorkspace = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user.id });

    res.status(200).json({ success: true, workspaces });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSingleWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      (member) => member.toString() === req.user.id,
    );

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace not found' });
    }

    const canDelete =
      req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Task.deleteMany({ workspace: workspaceId });
    await workspace.deleteOne();
    res
      .status(200)
      .json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const leaveWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      (member) => member.toString() === req.user.id,
    );
    if (!isMember) {
      return res
        .status(404)
        .json({ success: false, message: 'Not a member of this workspace' });
    }

    if (workspace.owner?.toString() === req.user.id) {
      return res
        .status(409)
        .json({ success: false, message: 'Owner cannot leave' });
    }

    const activeTasks = await Task.countDocuments({
      workspace: workspaceId,
      assignedTo: req.user.id,
      status: { $ne: 'Completed' },
    });

    if (activeTasks > 0) {
      return res.status(409).json({
        success: false,
        message:
          'Complete or reassign your active tasks before leaving the workspace',
      });
    }

    workspace.members = workspace.members.filter(
      (member) => member.toString() !== req.user.id,
    );
    await workspace.save();

    res.status(200).json({ success: true, message: 'You left the workspace' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//member management
export const inviteMember = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    let { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is required' });
    }

    email = email.trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace not found' });
    }

    const canInvite =
      req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
    if (!canInvite) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const isMember = workspace.members.some(
      (member) => member.toString() === user._id.toString(),
    );
    if (isMember) {
      return res
        .status(409)
        .json({ success: false, message: 'User is already a member' });
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
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId).populate(
      'members',
      'name email role',
    );
    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace not found' });
    }

    const canView =
      req.user.role === 'admin' ||
      workspace.members.some((member) => member._id.toString() === req.user.id);
    if (!canView) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, members: workspace.members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace not found' });
    }

    const canRemove =
      req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
    if (!canRemove) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (workspace.owner?.toString() === userId) {
      return res
        .status(400)
        .json({ success: false, message: 'Owner cannot be removed' });
    }

    const isMember = workspace.members.some(
      (member) => member.toString() === userId,
    );
    if (!isMember) {
      return res
        .status(409)
        .json({ success: false, message: 'User is not a member' });
    }

    workspace.members = workspace.members.filter(
      (member) => member.toString() !== userId,
    );
    await workspace.save();

    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
