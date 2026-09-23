import { describe, it, vi, expect, afterEach } from "vitest";
import Task from "../models/Task";
import User from "../models/User";
import Workspace from "../models/Workspace";
import {
  deleteUser,
  getAdminDashboard,
  getAllTasks,
  getAllUsers,
  getAllWorkspaces,
  getTaskById,
  getWorkspaceById,
  updateUserRole,
} from "../controllers/adminController";

describe("getAdminDashboard", () => {
  it("should return dashboard statistics successfully", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(User, "countDocuments").mockResolvedValue(25);

    vi.spyOn(Workspace, "countDocuments").mockResolvedValue(8);

    const taskCount = vi
      .spyOn(Task, "countDocuments")
      .mockResolvedValueOnce(40)
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(7);

    getAdminDashboard(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.countDocuments).toHaveBeenCalledWith();

    expect(Workspace.countDocuments).toHaveBeenCalledWith();

    expect(taskCount).toHaveBeenNthCalledWith(1);

    expect(taskCount).toHaveBeenNthCalledWith(2, {
      status: "Completed",
    });

    expect(taskCount).toHaveBeenNthCalledWith(3, {
      status: "Todo",
    });

    expect(taskCount).toHaveBeenNthCalledWith(4, {
      status: "In Progress",
    });

    expect(taskCount).toHaveBeenNthCalledWith(5, {
      status: "Review",
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      stats: {
        users: 25,
        workspaces: 8,
        tasks: 40,
        todo: 10,
        inProgress: 8,
        review: 7,
        completed: 15,
      },
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass database errors to next", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const error = new Error("Database connection failed");

    vi.spyOn(User, "countDocuments").mockRejectedValue(error);

    getAdminDashboard(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getAllWorkspaces", () => {
  it("should return all workspaces with member and task statistics", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspaces = [
      {
        _id: "workspace-1",
        name: "Backend",
        description: "Backend workspace",
        owner: {
          _id: "user-1",
          name: "Manager",
          email: "manager@example.com",
        },
        members: ["user-1", "user-2", "user-3"],
        createdAt: "2026-09-20",
      },
      {
        _id: "workspace-2",
        name: "Frontend",
        description: "Frontend workspace",
        owner: {
          _id: "user-2",
          name: "Developer",
          email: "developer@example.com",
        },
        members: ["user-2"],
        createdAt: "2026-09-21",
      },
    ];

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(workspaces);

    vi.spyOn(Workspace, "find").mockReturnValue(query);

    vi.spyOn(Task, "countDocuments")
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);

    getAllWorkspaces(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.find).toHaveBeenCalledWith();

    expect(query.populate).toHaveBeenCalledWith("owner", "name email");

    expect(query.lean).toHaveBeenCalled();

    expect(Task.countDocuments).toHaveBeenNthCalledWith(1, {
      workspace: "workspace-1",
    });

    expect(Task.countDocuments).toHaveBeenNthCalledWith(2, {
      workspace: "workspace-2",
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspaces: [
        {
          id: "workspace-1",
          name: "Backend",
          description: "Backend workspace",
          owner: {
            id: "user-1",
            name: "Manager",
            email: "manager@example.com",
          },
          memberCount: 3,
          taskCount: 5,
          createdAt: "2026-09-20",
        },
        {
          id: "workspace-2",
          name: "Frontend",
          description: "Frontend workspace",
          owner: {
            id: "user-2",
            name: "Developer",
            email: "developer@example.com",
          },
          memberCount: 1,
          taskCount: 2,
          createdAt: "2026-09-21",
        },
      ],
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should use deleted user fallback when workspace owner no longer exists", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspaces = [
      {
        _id: "workspace-1",
        name: "Backend",
        description: "Backend workspace",
        owner: null,
        members: ["user-1", "user-2"],
        createdAt: "2026-09-20",
      },
    ];

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(workspaces);

    vi.spyOn(Workspace, "find").mockReturnValue(query);

    vi.spyOn(Task, "countDocuments").mockResolvedValue(3);

    getAllWorkspaces(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspaces: [
        {
          id: "workspace-1",
          name: "Backend",
          description: "Backend workspace",
          owner: {
            id: null,
            name: "Deleted User",
            email: "deleted@workspace.com",
          },
          memberCount: 2,
          taskCount: 3,
          createdAt: "2026-09-20",
        },
      ],
    });
  });

  it("should return an empty workspace list when no workspaces exist", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue([]);

    vi.spyOn(Workspace, "find").mockReturnValue(query);

    getAllWorkspaces(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.countDocuments).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspaces: [],
    });
  });
});

describe("getWorkspaceById", () => {
  it("should throw 404 when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(null);

    vi.spyOn(Workspace, "findById").mockReturnValue(query);

    getWorkspaceById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should return workspace with members and tasks successfully", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspace = {
      _id: "workspace-1",
      name: "Backend",
      description: "Backend workspace",
      owner: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      members: [
        {
          _id: "user-1",
          name: "Manager",
          email: "manager@example.com",
          role: "manager",
        },
        {
          _id: "user-2",
          name: "Developer",
          email: "developer@example.com",
          role: "member",
        },
      ],
      createdAt: "2026-09-20",
    };

    const workspaceQuery = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    workspaceQuery.lean.mockResolvedValue(workspace);

    const tasks = [
      {
        _id: "task-1",
        title: "Build API",
        description: "Build backend API",
        priority: "High",
        status: "In Progress",
        deadline: "2026-12-01",
        assignedTo: {
          _id: "user-2",
          name: "Developer",
          email: "developer@example.com",
        },
        createdBy: {
          _id: "user-1",
          name: "Manager",
          email: "manager@example.com",
        },
        createdAt: "2026-09-20",
      },
    ];

    const taskQuery = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    taskQuery.lean.mockResolvedValue(tasks);

    vi.spyOn(Workspace, "findById").mockReturnValue(workspaceQuery);
    vi.spyOn(Task, "find").mockReturnValue(taskQuery);

    getWorkspaceById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(workspaceQuery.populate).toHaveBeenNthCalledWith(
      1,
      "owner",
      "name email",
    );

    expect(workspaceQuery.populate).toHaveBeenNthCalledWith(
      2,
      "members",
      "name email role",
    );

    expect(workspaceQuery.lean).toHaveBeenCalled();

    expect(Task.find).toHaveBeenCalledWith({
      workspace: "workspace-1",
    });

    expect(taskQuery.populate).toHaveBeenNthCalledWith(
      1,
      "assignedTo",
      "name email role",
    );

    expect(taskQuery.populate).toHaveBeenNthCalledWith(
      2,
      "createdBy",
      "name email",
    );

    expect(taskQuery.lean).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspace: {
        id: "workspace-1",
        name: "Backend",
        description: "Backend workspace",
        owner: {
          id: "user-1",
          name: "Manager",
          email: "manager@example.com",
        },
        members: [
          {
            id: "user-1",
            name: "Manager",
            email: "manager@example.com",
            role: "manager",
          },
          {
            id: "user-2",
            name: "Developer",
            email: "developer@example.com",
            role: "member",
          },
        ],
        tasks: [
          {
            id: "task-1",
            title: "Build API",
            description: "Build backend API",
            priority: "High",
            status: "In Progress",
            deadline: "2026-12-01",
            assignedTo: {
              id: "user-2",
              name: "Developer",
              email: "developer@example.com",
            },
            createdBy: {
              id: "user-1",
              name: "Manager",
              email: "manager@example.com",
            },
            createdAt: "2026-09-20",
          },
        ],
        createdAt: "2026-09-20",
      },
    });
  });

  it("should use fallback values for deleted owner, deleted members, and deleted task creator", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspace = {
      _id: "workspace-1",
      name: "Backend",
      description: "Backend workspace",
      owner: null,
      members: [
        null,
        {
          _id: "user-2",
          name: "Developer",
          email: "developer@example.com",
          role: "member",
        },
      ],
      createdAt: "2026-09-20",
    };

    const workspaceQuery = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    workspaceQuery.lean.mockResolvedValue(workspace);

    const tasks = [
      {
        _id: "task-1",
        title: "Orphan Task",
        description: "Task description",
        priority: "Low",
        status: "Todo",
        deadline: "2026-12-01",
        assignedTo: null,
        createdBy: null,
        createdAt: "2026-09-20",
      },
    ];

    const taskQuery = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    taskQuery.lean.mockResolvedValue(tasks);

    vi.spyOn(Workspace, "findById").mockReturnValue(workspaceQuery);
    vi.spyOn(Task, "find").mockReturnValue(taskQuery);

    getWorkspaceById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspace: {
        id: "workspace-1",
        name: "Backend",
        description: "Backend workspace",
        owner: {
          id: null,
          name: "Deleted User",
          email: "deleted@workspace.com",
        },
        members: [
          {
            id: "user-2",
            name: "Developer",
            email: "developer@example.com",
            role: "member",
          },
        ],
        tasks: [
          {
            id: "task-1",
            title: "Orphan Task",
            description: "Task description",
            priority: "Low",
            status: "Todo",
            deadline: "2026-12-01",
            assignedTo: null,
            createdBy: {
              id: null,
              name: "Deleted User",
              email: "deleted@workspace.com",
            },
            createdAt: "2026-09-20",
          },
        ],
        createdAt: "2026-09-20",
      },
    });
  });
});

describe("getAllTasks", () => {
  it("should return all tasks successfully", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const tasks = [
      {
        _id: "task-1",
        title: "Build API",
        description: "Build backend API",
        priority: "High",
        status: "In Progress",
        deadline: "2026-12-01",
        assignedTo: {
          _id: "user-2",
          name: "Developer",
          email: "developer@example.com",
          role: "member",
        },
        createdBy: {
          _id: "user-1",
          name: "Manager",
          email: "manager@example.com",
        },
        workspace: {
          _id: "workspace-1",
          name: "Backend",
        },
        createdAt: "2026-09-20",
        updatedAt: "2026-09-21",
      },
    ];

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(tasks);

    vi.spyOn(Task, "find").mockReturnValue(query);

    getAllTasks(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.find).toHaveBeenCalledWith();

    expect(query.populate).toHaveBeenNthCalledWith(
      1,
      "assignedTo",
      "name email role",
    );

    expect(query.populate).toHaveBeenNthCalledWith(
      2,
      "createdBy",
      "name email",
    );

    expect(query.populate).toHaveBeenNthCalledWith(3, "workspace", "name");

    expect(query.lean).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      tasks: [
        {
          id: "task-1",
          title: "Build API",
          description: "Build backend API",
          priority: "High",
          status: "In Progress",
          deadline: "2026-12-01",
          assignedTo: {
            id: "user-2",
            name: "Developer",
            email: "developer@example.com",
          },
          createdBy: {
            id: "user-1",
            name: "Manager",
            email: "manager@example.com",
          },
          workspace: {
            id: "workspace-1",
            name: "Backend",
          },
          createdAt: "2026-09-20",
          updatedAt: "2026-09-21",
        },
      ],
    });
  });

  it("should use fallback values for deleted creator and workspace and null for unassigned task", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const tasks = [
      {
        _id: "task-1",
        title: "Orphan Task",
        description: "Task description",
        priority: "Low",
        status: "Todo",
        deadline: "2026-12-01",
        assignedTo: null,
        createdBy: null,
        workspace: null,
        createdAt: "2026-09-20",
        updatedAt: "2026-09-21",
      },
    ];

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(tasks);

    vi.spyOn(Task, "find").mockReturnValue(query);

    getAllTasks(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      tasks: [
        {
          id: "task-1",
          title: "Orphan Task",
          description: "Task description",
          priority: "Low",
          status: "Todo",
          deadline: "2026-12-01",
          assignedTo: null,
          createdBy: {
            id: null,
            name: "Deleted User",
            email: "deleted@workspace.com",
          },
          workspace: {
            id: null,
            name: "Deleted Workspace",
          },
          createdAt: "2026-09-20",
          updatedAt: "2026-09-21",
        },
      ],
    });
  });

  it("should return an empty task list when no tasks exist", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue([]);

    vi.spyOn(Task, "find").mockReturnValue(query);

    getAllTasks(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      tasks: [],
    });
  });
});

describe("getTaskById", () => {
  it("should throw 404 when task does not exist", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(null);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    getTaskById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Task not found",
        statusCode: 404,
      }),
    );
  });

  it("should return the task successfully", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      title: "Build API",
      description: "Build backend API",
      priority: "High",
      status: "In Progress",
      deadline: "2026-12-01",
      assignedTo: {
        _id: "user-2",
        name: "Developer",
        email: "developer@example.com",
        role: "member",
      },
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
      },
      createdAt: "2026-09-20",
      updatedAt: "2026-09-21",
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    getTaskById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.findById).toHaveBeenCalledWith("task-1");

    expect(query.populate).toHaveBeenNthCalledWith(
      1,
      "assignedTo",
      "name email role",
    );

    expect(query.populate).toHaveBeenNthCalledWith(
      2,
      "createdBy",
      "name email",
    );

    expect(query.populate).toHaveBeenNthCalledWith(3, "workspace", "name");

    expect(query.lean).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      task: {
        id: "task-1",
        title: "Build API",
        description: "Build backend API",
        priority: "High",
        status: "In Progress",
        deadline: "2026-12-01",
        assignedTo: {
          id: "user-2",
          name: "Developer",
          email: "developer@example.com",
        },
        createdBy: {
          id: "user-1",
          name: "Manager",
          email: "manager@example.com",
        },
        workspace: {
          id: "workspace-1",
          name: "Backend",
        },
        createdAt: "2026-09-20",
        updatedAt: "2026-09-21",
      },
    });
  });

  it("should use fallback values for unassigned task, deleted creator, and deleted workspace", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      title: "Orphan Task",
      description: "Task description",
      priority: "Low",
      status: "Todo",
      deadline: "2026-12-01",
      assignedTo: null,
      createdBy: null,
      workspace: null,
      createdAt: "2026-09-20",
      updatedAt: "2026-09-21",
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    getTaskById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      task: {
        id: "task-1",
        title: "Orphan Task",
        description: "Task description",
        priority: "Low",
        status: "Todo",
        deadline: "2026-12-01",
        assignedTo: null,
        createdBy: {
          id: null,
          name: "Deleted User",
          email: "deleted@workspace.com",
        },
        workspace: {
          id: null,
          name: "Deleted Workspace",
        },
        createdAt: "2026-09-20",
        updatedAt: "2026-09-21",
      },
    });
  });
});

describe("getAllUsers", () => {
  it("should return all users without passwords", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const users = [
      {
        _id: "user-1",
        name: "John",
        email: "john@example.com",
        role: "member",
        password: "hashed-password",
        createdAt: "2026-09-20",
      },
      {
        _id: "user-2",
        name: "Jane",
        email: "jane@example.com",
        role: "manager",
        password: "another-hash",
        createdAt: "2026-09-21",
      },
    ];

    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue(users);

    vi.spyOn(User, "find").mockReturnValue(query);

    getAllUsers(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.find).toHaveBeenCalledWith();

    expect(query.select).toHaveBeenCalledWith("-password");

    expect(query.lean).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      users: [
        {
          id: "user-1",
          name: "John",
          email: "john@example.com",
          role: "member",
          createdAt: "2026-09-20",
        },
        {
          id: "user-2",
          name: "Jane",
          email: "jane@example.com",
          role: "manager",
          createdAt: "2026-09-21",
        },
      ],
    });
  });

  it("should return an empty user list when no users exist", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn(),
    };

    query.lean.mockResolvedValue([]);

    vi.spyOn(User, "find").mockReturnValue(query);

    getAllUsers(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      users: [],
    });
  });

  it("should pass database errors to next", async () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const error = new Error("Database error");

    vi.spyOn(User, "find").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockRejectedValue(error),
    });

    getAllUsers(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("updateUserRole", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw 400 when user tries to change their own role", async () => {
    const req = {
      params: {
        userId: "user-1",
      },
      body: {
        role: "admin",
      },
      user: {
        id: "user-1",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(User, "findByIdAndUpdate");

    updateUserRole(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "You cannot change your own role",
        statusCode: 400,
      }),
    );

    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("should throw 400 when role is invalid", async () => {
    const req = {
      params: {
        userId: "user-2",
      },
      body: {
        role: "superadmin",
      },
      user: {
        id: "admin-1",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(User, "findByIdAndUpdate");

    updateUserRole(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid role",
        statusCode: 400,
      }),
    );

    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("should throw 404 when target user does not exist", async () => {
    const req = {
      params: {
        userId: "user-2",
      },
      body: {
        role: "manager",
      },
      user: {
        id: "admin-1",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      select: vi.fn().mockReturnThis(),
    };

    query.select.mockResolvedValue(null);

    vi.spyOn(User, "findByIdAndUpdate").mockReturnValue(query);

    updateUserRole(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-2",
      { role: "manager" },
      { new: true },
    );

    expect(query.select).toHaveBeenCalledWith("-password");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      }),
    );
  });

  it("should update the user's role successfully", async () => {
    const req = {
      params: {
        userId: "user-2",
      },
      body: {
        role: "manager",
      },
      user: {
        id: "admin-1",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const user = {
      _id: "user-2",
      name: "John",
      email: "john@example.com",
      role: "manager",
      createdAt: "2026-09-20",
    };

    const query = {
      select: vi.fn().mockReturnThis(),
    };

    query.select.mockResolvedValue(user);

    vi.spyOn(User, "findByIdAndUpdate").mockReturnValue(query);

    updateUserRole(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-2",
      { role: "manager" },
      { new: true },
    );

    expect(query.select).toHaveBeenCalledWith("-password");

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id: "user-2",
        name: "John",
        email: "john@example.com",
        role: "manager",
        createdAt: "2026-09-20",
      },
    });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("deleteUser", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw 400 when user tries to delete their own account", async () => {
    const req = {
      params: {
        userId: "admin-1",
      },
      user: {
        id: "admin-1",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "countDocuments");
    vi.spyOn(Workspace, "updateMany");
    vi.spyOn(Task, "updateMany");
    vi.spyOn(User, "findByIdAndDelete");

    deleteUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "You cannot delete your own account",
        statusCode: 400,
      }),
    );

    expect(Workspace.countDocuments).not.toHaveBeenCalled();
    expect(Workspace.updateMany).not.toHaveBeenCalled();
    expect(Task.updateMany).not.toHaveBeenCalled();
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("should throw 400 when user owns one or more workspaces", async () => {
    const req = {
      params: {
        userId: "user-1",
      },
      user: {
        id: "admin-1",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "countDocuments").mockResolvedValue(2);
    vi.spyOn(Workspace, "updateMany");
    vi.spyOn(Task, "updateMany");
    vi.spyOn(User, "findByIdAndDelete");

    deleteUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.countDocuments).toHaveBeenCalledWith({
      owner: "user-1",
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Cannot delete user. This user owns one or more workspaces. Please delete the workspaces or transfer ownership first.",
        statusCode: 400,
      }),
    );

    expect(Workspace.updateMany).not.toHaveBeenCalled();
    expect(Task.updateMany).not.toHaveBeenCalled();
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("should throw 404 when user does not exist", async () => {
    const req = {
      params: {
        userId: "user-1",
      },
      user: {
        id: "admin-1",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "countDocuments").mockResolvedValue(0);

    vi.spyOn(Workspace, "updateMany").mockResolvedValue({
      modifiedCount: 1,
    });

    vi.spyOn(Task, "updateMany").mockResolvedValue({
      modifiedCount: 2,
    });

    vi.spyOn(User, "findByIdAndDelete").mockResolvedValue(null);

    deleteUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.countDocuments).toHaveBeenCalledWith({
      owner: "user-1",
    });

    expect(Workspace.updateMany).toHaveBeenCalledWith(
      { members: "user-1" },
      { $pull: { members: "user-1" } },
    );

    expect(Task.updateMany).toHaveBeenCalledWith(
      { assignedTo: "user-1" },
      { $unset: { assignedTo: 1 } },
    );

    expect(User.findByIdAndDelete).toHaveBeenCalledWith("user-1");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      }),
    );
  });

  it("should delete the user and clean up related data successfully", async () => {
    const req = {
      params: {
        userId: "user-1",
      },
      user: {
        id: "admin-1",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "countDocuments").mockResolvedValue(0);

    vi.spyOn(Workspace, "updateMany").mockResolvedValue({
      modifiedCount: 2,
    });

    vi.spyOn(Task, "updateMany").mockResolvedValue({
      modifiedCount: 3,
    });

    vi.spyOn(User, "findByIdAndDelete").mockResolvedValue({
      _id: "user-1",
      name: "John",
      email: "john@example.com",
    });

    deleteUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.countDocuments).toHaveBeenCalledWith({
      owner: "user-1",
    });

    expect(Workspace.updateMany).toHaveBeenCalledWith(
      { members: "user-1" },
      { $pull: { members: "user-1" } },
    );

    expect(Task.updateMany).toHaveBeenCalledWith(
      { assignedTo: "user-1" },
      { $unset: { assignedTo: 1 } },
    );

    expect(User.findByIdAndDelete).toHaveBeenCalledWith("user-1");

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User deleted successfully",
    });

    expect(next).not.toHaveBeenCalled();
  });
});
