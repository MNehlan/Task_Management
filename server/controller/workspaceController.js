import Workspace from '../models/Workspace.js';
import validator from 'validator';

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
        .status(400)
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
    res.status(500).json({ success: false, message: error.message });
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
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res
        .status(404)
        .json({ success: false, message: 'Workspace not found' });
    }

    const isMember = workspace.members.includes(req.user.id);

    if (!isMember) {
      return res.status(401).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
