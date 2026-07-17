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
