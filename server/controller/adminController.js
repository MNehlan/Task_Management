import Task from '../models/Task.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

export const getAdminDashboard = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const workspaces = await Workspace.countDocuments();
    const tasks = await Task.countDocuments();
    const completed = await Task.countDocuments({
      status: 'Completed',
    });
    const todo = await Task.countDocuments({
      status: 'Todo',
    });
    const inProgress = await Task.countDocuments({
      status: 'In Progress',
    });
    const review = await Task.countDocuments({
      status: 'Review',
    });

    return res.status(200).json({
      success: true,
      stats: {
        users,
        workspaces,
        tasks,
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
