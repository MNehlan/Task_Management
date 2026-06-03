import validator from 'validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

export const createTask = async (req, res) => {
  try {
    let { title, description, priority, deadline, workspaceId, assignedTo } =
      req.body;

    if (!title || !description || !deadline || !workspaceId) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields required' });
    }

    title = title.trim();
    description = description.trim();

    if (validator.isEmpty(title) || validator.isEmpty(description)) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields required' });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace does not exist' });
    }

    const canCreate =
      req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;
    if (!canCreate) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (assignedTo) {
      const user = await User.findById(assignedTo);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const isMember = workspace.members.some(
        (member) => member.toString() === assignedTo,
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: 'User is not a member of this workspace',
        });
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

    res
      .status(201)
      .json({ success: true, task, message: 'Task created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTaskByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace does not exist' });
    }

    if (req.user.role !== 'admin') {
      const isMember = workspace.members.some(
        (member) => member.toString() === req.user.id,
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'User is not a member of this workspace',
        });
      }
    }

    const tasks = await Task.find({
      workspace: workspaceId,
    })
      .populate('workspace', 'name description')
      .populate('assignedTo', 'name email');

    const formattedTasks = tasks.map((task) => ({
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
          }
        : null,

      workspace: {
        name: task.workspace.name,
        description: task.workspace.description,
      },
    }));
    
    res.status(200).json({
      success: true,
      tasks: formattedTasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatus = ['Todo', 'In Progress', 'Review', 'Completed'];

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Not a valid status',
      });
    }

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('workspace', 'name owner members');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const isMember =
      req.user.role === 'admin' ||
      task.workspace.members.some(
        (member) => member.toString() === req.user.id,
      );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const canUpdate =
      req.user.role === 'admin' ||
      task.workspace.owner?.toString() === req.user.id ||
      task.assignedTo?._id?.toString() === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update task status',
      });
    }

    task.status = status;

    await task.save();

    res.status(200).json({
      success: true,

      task: {
        id: task._id,

        title: task.title,

        status: task.status,

        assignedTo: task.assignedTo
          ? {
              id: task.assignedTo._id,
              name: task.assignedTo.name,
              email: task.assignedTo.email,
            }
          : null,

        workspace: {
          id: task.workspace._id,
          name: task.workspace.name,
        },

        updatedAt: task.updatedAt,
      },

      message: 'Task status updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('workspace', 'name members');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const canView =
      req.user.role === 'admin' ||
      task.workspace.members.some(
        (member) => member.toString() === req.user.id,
      );

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.status(200).json({
      success: true,

      task: {
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { title, description, priority, deadline, assignedTo } = req.body;

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email role')
      .populate('workspace', 'name owner members');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const canEdit =
      req.user.role === 'admin' ||
      task.workspace.owner?.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (assignedTo) {
      const user = await User.findById(assignedTo);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found',
        });
      }

      const isMember = task.workspace.members.some(
        (member) => member.toString() === assignedTo,
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: 'User is not a member of this workspace',
        });
      }

      task.assignedTo = user._id;

      await task.populate('assignedTo', 'name email role');
    }

    if (deadline) {
      if (isNaN(new Date(deadline))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deadline format',
        });
      }
    }

    if (title) task.title = title;

    if (description) task.description = description;

    if (priority) task.priority = priority;

    if (deadline) task.deadline = deadline;

    await task.save();

    res.status(200).json({
      success: true,

      tasks: {
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

        workspace: {
          id: task.workspace._id,

          name: task.workspace.name,
        },

        updatedAt: task.updatedAt,
      },

      message: 'Task updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    const workspace = await Workspace.findById(task.workspace);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const canDelete =
      req.user.role === 'admin' || workspace.owner?.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete task',
      });
    }

    await task.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
