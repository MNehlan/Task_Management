import Task from '../models/Task.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

export const getAdminDashboard = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllWorkspaces = async (req, res) => {
  try {
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
      })
    );

    res.status(200).json({ success: true, workspaces: workspacesWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWorkspaceById = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .lean();

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
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
            ? { id: task.assignedTo._id, name: task.assignedTo.name, email: task.assignedTo.email }
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTasks = async (req, res) => {
  try {
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
          ? { id: task.assignedTo._id, name: task.assignedTo.name, email: task.assignedTo.email }
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('workspace', 'name')
      .lean();

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
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
          ? { id: task.assignedTo._id, name: task.assignedTo.name, email: task.assignedTo.email }
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const validRoles = ['member', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




