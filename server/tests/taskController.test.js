import { describe, it, vi, expect } from "vitest";
import Workspace from "../models/Workspace";
import User from "../models/User";
import Task from "../models/Task";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskByWorkspace,
  updateTask,
  updateTaskStatus,
} from "../controllers/taskController";

describe("createTask", () => {
  it("should throw 400 when required fields are missing", async () => {
    const req = {
      body: {
        title: "Task",
        description: "Description",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "All fields required",
        statusCode: 400,
      }),
    );
  });

  it("should throw 400 when title or description is not a string", async () => {
    const req = {
      body: {
        title: 123,
        description: "Description",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Title and description must be text strings",
        statusCode: 400,
      }),
    );
  });

  it("should throw 400 when title or description is empty after trimming", async () => {
    const req = {
      body: {
        title: "   ",
        description: "Description",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "All fields required",
        statusCode: 400,
      }),
    );
  });

  it("should throw 404 when workspace does not exist", async () => {
    const req = {
      body: {
        title: "Task",
        description: "Description",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should throw 403 when requester is not workspace owner or admin", async () => {
    const req = {
      body: {
        title: "Task",
        description: "Description",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
      },
      user: {
        id: "user-2",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      owner: "user-1",
      members: ["user-1", "user-2"],
    });

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should throw 400 when assigning the task to yourself", async () => {
    const req = {
      body: {
        title: "Task",
        description: "Description",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
        assignedTo: "user-1",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      owner: "user-1",
      members: ["user-1", "user-2"],
    });

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "You cannot assign a task to yourself. Please assign it to another workspace member.",
        statusCode: 400,
      }),
    );
  });

  it("should throw 404 when assigned user does not exist", async () => {
    const req = {
      body: {
        title: "Task",
        description: "Description",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
        assignedTo: "user-2",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      owner: "user-1",
      members: ["user-1", "user-2"],
    });

    vi.spyOn(User, "findById").mockResolvedValue(null);

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      }),
    );
  });

  it("should throw 400 when assigned user is not a workspace member", async () => {
    const req = {
      body: {
        title: "Task",
        description: "Description",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
        assignedTo: "user-3",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      owner: "user-1",
      members: ["user-1", "user-2"],
    });

    vi.spyOn(User, "findById").mockResolvedValue({
      _id: "user-3",
      name: "John",
      email: "john@example.com",
      role: "member",
    });

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User is not a member of this workspace",
        statusCode: 400,
      }),
    );
  });

  it("should create a task successfully without an assignee", async () => {
    const req = {
      body: {
        title: "  Build API  ",
        description: "  Build task API  ",
        priority: "High",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
      },
      user: {
        id: "user-1",
        role: "manager",
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
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",

      populate: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      owner: "user-1",
      members: ["user-1", "user-2"],
    });

    vi.spyOn(Task, "create").mockResolvedValue(task);

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.create).toHaveBeenCalledWith({
      title: "Build API",
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      workspace: "workspace-1",
      assignedTo: undefined,
      createdBy: "user-1",
    });

    expect(task.populate).toHaveBeenCalledTimes(3);

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      task: {
        id: "task-1",
        title: "Build API",
        description: "Build task API",
        priority: "High",
        deadline: "2026-12-01",
        status: "Todo",
        assignedTo: null,
        createdBy: {
          id: "user-1",
          name: "Manager",
          email: "manager@example.com",
        },
        workspace: {
          id: "workspace-1",
          name: "Backend",
        },
        createdAt: "2026-09-23",
        updatedAt: "2026-09-23",
      },
      message: "Task created successfully",
    });
  });

  it("should create a task successfully with a valid workspace member assigned", async () => {
    const req = {
      body: {
        title: "Build API",
        description: "Build task API",
        priority: "High",
        deadline: "2026-12-01",
        workspaceId: "workspace-1",
        assignedTo: "user-2",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const assignedUser = {
      _id: "user-2",
      name: "Developer",
      email: "developer@example.com",
      role: "member",
    };

    const task = {
      _id: "task-1",
      title: "Build API",
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: assignedUser,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",

      populate: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      owner: "user-1",
      members: ["user-1", "user-2"],
    });

    vi.spyOn(User, "findById").mockResolvedValue(assignedUser);
    vi.spyOn(Task, "create").mockResolvedValue(task);

    createTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findById).toHaveBeenCalledWith("user-2");

    expect(Task.create).toHaveBeenCalledWith({
      title: "Build API",
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      workspace: "workspace-1",
      assignedTo: "user-2",
      createdBy: "user-1",
    });

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Task created successfully",
      }),
    );

    expect(res.json.mock.calls[0][0].task.assignedTo).toEqual({
      id: "user-2",
      name: "Developer",
      email: "developer@example.com",
      role: "member",
    });
  });
});

describe("getTaskByWorkspace", () => {
  it("should throw 404 when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    getTaskByWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should throw 403 when user is not a member of the workspace", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "user-3",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      members: ["user-1", "user-2"],
    });

    getTaskByWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User is not a member of this workspace",
        statusCode: 403,
      }),
    );
  });

  it("should allow admin to access the workspace even when they are not a member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
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

    const task = {
      _id: "task-1",
      title: "Build API",
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: {
        _id: "user-1",
        name: "Developer",
        email: "developer@example.com",
        role: "member",
      },
      createdBy: {
        _id: "admin-1",
        name: "Admin",
        email: "admin@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce([task]);

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      members: ["user-1", "user-2"],
    });

    vi.spyOn(Task, "find").mockReturnValue(query);

    getTaskByWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.find).toHaveBeenCalledWith({
      workspace: "workspace-1",
    });

    expect(query.populate).toHaveBeenCalledWith(
      "assignedTo",
      "name email role",
    );

    expect(query.populate).toHaveBeenCalledWith("createdBy", "name email");

    expect(query.populate).toHaveBeenCalledWith("workspace", "name");

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      tasks: [
        {
          id: "task-1",
          title: "Build API",
          description: "Build task API",
          priority: "High",
          deadline: "2026-12-01",
          status: "Todo",
          assignedTo: {
            id: "user-1",
            name: "Developer",
            email: "developer@example.com",
            role: "member",
          },
          createdBy: {
            id: "admin-1",
            name: "Admin",
            email: "admin@example.com",
          },
          workspace: {
            id: "workspace-1",
            name: "Backend",
          },
          createdAt: "2026-09-23",
          updatedAt: "2026-09-23",
        },
      ],
    });
  });

  it("should return tasks successfully for a workspace member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task1 = {
      _id: "task-1",
      title: "Task One",
      description: "First task",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: null,
      createdBy: null,
      workspace: null,
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
    };

    const task2 = {
      _id: "task-2",
      title: "Task Two",
      description: "Second task",
      priority: "Low",
      deadline: "2026-12-02",
      status: "Completed",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Member",
        email: "member@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce([task1, task2]);

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      members: ["user-1", "user-2"],
    });

    vi.spyOn(Task, "find").mockReturnValue(query);

    getTaskByWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.find).toHaveBeenCalledWith({
      workspace: "workspace-1",
    });

    expect(query.populate).toHaveBeenCalledWith(
      "assignedTo",
      "name email role",
    );

    expect(query.populate).toHaveBeenCalledWith("createdBy", "name email");

    expect(query.populate).toHaveBeenCalledWith("workspace", "name");

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      tasks: [
        {
          id: "task-1",
          title: "Task One",
          description: "First task",
          priority: "High",
          deadline: "2026-12-01",
          status: "Todo",
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
          createdAt: "2026-09-23",
          updatedAt: "2026-09-23",
        },
        {
          id: "task-2",
          title: "Task Two",
          description: "Second task",
          priority: "Low",
          deadline: "2026-12-02",
          status: "Completed",
          assignedTo: null,
          createdBy: {
            id: "user-1",
            name: "Member",
            email: "member@example.com",
          },
          workspace: {
            id: "workspace-1",
            name: "Backend",
          },
          createdAt: "2026-09-23",
          updatedAt: "2026-09-23",
        },
      ],
    });
  });
});

describe("updateTaskStatus", () => {
  it("should throw 400 when status is missing", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {},
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Status is required",
        statusCode: 400,
      }),
    );
  });

  it("should throw 400 when status is invalid", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        status: "Cancelled",
      },
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Not a valid status",
        statusCode: 400,
      }),
    );
  });

  it("should throw 404 when task does not exist", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        status: "Completed",
      },
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(null);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Task not found",
        statusCode: 404,
      }),
    );
  });

  it("should throw 404 when the task's workspace is missing", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        status: "Completed",
      },
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
      },
      workspace: null,
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace associated with this task not found or deleted",
        statusCode: 404,
      }),
    );
  });

  it("should throw 403 when user is not a workspace member", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        status: "Completed",
      },
      user: {
        id: "user-3",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      assignedTo: {
        _id: "user-2",
      },
      workspace: {
        owner: "user-1",
        members: ["user-1", "user-2"],
      },
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should throw 403 when member is not the owner or assigned user", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        status: "Completed",
      },
      user: {
        id: "user-2",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      assignedTo: {
        _id: "user-3",
      },
      workspace: {
        owner: "user-1",
        members: ["user-1", "user-2", "user-3"],
      },
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Not authorized to update task status",
        statusCode: 403,
      }),
    );
  });

  it("should allow the assigned member to update the task status", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        status: "Completed",
      },
      user: {
        id: "user-2",
        role: "member",
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
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
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
        owner: "user-1",
        members: ["user-1", "user-2"],
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
      save: vi.fn().mockResolvedValue(undefined),
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(task.status).toBe("Completed");
    expect(task.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Task status updated successfully",
        task: expect.objectContaining({
          id: "task-1",
          status: "Completed",
        }),
      }),
    );
  });

  it("should allow the workspace owner to update the task status", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        status: "In Progress",
      },
      user: {
        id: "user-1",
        role: "manager",
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
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
        owner: "user-1",
        members: ["user-1"],
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
      save: vi.fn().mockResolvedValue(undefined),
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(task.status).toBe("In Progress");
    expect(task.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Task status updated successfully",
      }),
    );
  });

  it("should allow admin to update the task status", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        status: "Review",
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

    const task = {
      _id: "task-1",
      title: "Build API",
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
        owner: "user-1",
        members: ["user-1"],
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
      save: vi.fn().mockResolvedValue(undefined),
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTaskStatus(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(task.status).toBe("Review");
    expect(task.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Task status updated successfully",
      }),
    );
  });
});

describe("getTaskById", () => {
  it("should throw 404 when task does not exist", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(null);

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

  it("should throw 404 when the task workspace is missing", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: null,
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    getTaskById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace associated with this task not found or deleted",
        statusCode: 404,
      }),
    );
  });

  it("should throw 403 when user is not a workspace member", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      user: {
        id: "user-3",
        role: "member",
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
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
        members: ["user-1", "user-2"],
      },
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    getTaskById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should return the task successfully for a workspace member", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      user: {
        id: "user-2",
        role: "member",
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
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
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
        members: ["user-1", "user-2"],
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    getTaskById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.findById).toHaveBeenCalledWith("task-1");

    expect(query.populate).toHaveBeenCalledWith(
      "assignedTo",
      "name email role",
    );

    expect(query.populate).toHaveBeenCalledWith("createdBy", "name email");

    expect(query.populate).toHaveBeenCalledWith("workspace", "name members");

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      task: {
        id: "task-1",
        title: "Build API",
        description: "Build task API",
        priority: "High",
        deadline: "2026-12-01",
        status: "Todo",
        assignedTo: {
          id: "user-2",
          name: "Developer",
          email: "developer@example.com",
          role: "member",
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
        createdAt: "2026-09-23",
        updatedAt: "2026-09-23",
      },
    });
  });

  it("should allow admin to retrieve a task without being a workspace member", async () => {
    const req = {
      params: {
        taskId: "task-1",
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

    const task = {
      _id: "task-1",
      title: "Admin Task",
      description: "Task description",
      priority: "Medium",
      deadline: "2026-12-01",
      status: "Review",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
        members: ["user-1"],
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    getTaskById(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        task: expect.objectContaining({
          id: "task-1",
          title: "Admin Task",
          status: "Review",
        }),
      }),
    );
  });
});

describe("updateTask", () => {
  it("should throw 404 when task does not exist", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {},
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(null);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Task not found",
        statusCode: 404,
      }),
    );
  });

  it("should throw 404 when the task workspace is missing", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {},
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: null,
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace associated with this task not found or deleted",
        statusCode: 404,
      }),
    );
  });

  it("should throw 403 when requester is not workspace owner or admin", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        title: "Updated task",
      },
      user: {
        id: "user-2",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: {
        owner: "user-1",
        members: ["user-1", "user-2"],
      },
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Not authorized",
        statusCode: 403,
      }),
    );
  });

  it("should throw 400 when assigning the task to yourself", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        assignedTo: "user-1",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: {
        owner: "user-1",
        members: ["user-1", "user-2"],
      },
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "You cannot assign a task to yourself. Please assign it to another workspace member.",
        statusCode: 400,
      }),
    );
  });

  it("should throw 404 when assigned user does not exist", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        assignedTo: "user-2",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: {
        owner: "user-1",
        members: ["user-1", "user-2"],
      },
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);
    vi.spyOn(User, "findById").mockResolvedValue(null);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Assigned user not found",
        statusCode: 404,
      }),
    );
  });

  it("should throw 400 when assigned user is not a workspace member", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        assignedTo: "user-3",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: {
        owner: "user-1",
        members: ["user-1", "user-2"],
      },
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    const assignedUser = {
      _id: "user-3",
      name: "Developer",
      email: "developer@example.com",
      role: "member",
    };

    vi.spyOn(Task, "findById").mockReturnValue(query);
    vi.spyOn(User, "findById").mockResolvedValue(assignedUser);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User is not a member of this workspace",
        statusCode: 400,
      }),
    );
  });

  it("should throw 400 when deadline format is invalid", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        deadline: "not-a-date",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: {
        owner: "user-1",
        members: ["user-1"],
      },
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid deadline format",
        statusCode: 400,
      }),
    );
  });

  it("should update the task successfully", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        title: "Updated API",
        description: "Updated description",
        priority: "Low",
        deadline: "2026-12-31",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      title: "Old title",
      description: "Old description",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
        owner: "user-1",
        members: ["user-1"],
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
      save: vi.fn().mockResolvedValue(undefined),
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(task.title).toBe("Updated API");
    expect(task.description).toBe("Updated description");
    expect(task.priority).toBe("Low");
    expect(task.deadline).toBe("2026-12-31");

    expect(task.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Task updated successfully",
        task: expect.objectContaining({
          id: "task-1",
          title: "Updated API",
          description: "Updated description",
          priority: "Low",
          deadline: "2026-12-31",
        }),
      }),
    );
  });

  it("should update the assigned user successfully", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        assignedTo: "user-2",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const assignedUser = {
      _id: "user-2",
      name: "Developer",
      email: "developer@example.com",
      role: "member",
    };

    const task = {
      _id: "task-1",
      title: "Build API",
      description: "Build task API",
      priority: "High",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
        owner: "user-1",
        members: ["user-1", "user-2"],
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
      save: vi.fn().mockResolvedValue(undefined),
      populate: vi.fn().mockReturnThis(),
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);
    vi.spyOn(User, "findById").mockResolvedValue(assignedUser);

    task.populate.mockResolvedValue(undefined);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findById).toHaveBeenCalledWith("user-2");

    expect(task.assignedTo).toBe(assignedUser._id);

    expect(task.populate).toHaveBeenCalledWith("assignedTo", "name email role");

    expect(task.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Task updated successfully",
      }),
    );
  });

  it("should allow admin to update the task", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      body: {
        title: "Admin Updated Task",
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

    const task = {
      _id: "task-1",
      title: "Old title",
      description: "Description",
      priority: "Medium",
      deadline: "2026-12-01",
      status: "Todo",
      assignedTo: null,
      createdBy: {
        _id: "user-1",
        name: "Manager",
        email: "manager@example.com",
      },
      workspace: {
        _id: "workspace-1",
        name: "Backend",
        owner: "user-1",
        members: ["user-1"],
      },
      createdAt: "2026-09-23",
      updatedAt: "2026-09-23",
      save: vi.fn().mockResolvedValue(undefined),
    };

    const query = {
      populate: vi.fn().mockReturnThis(),
    };

    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockResolvedValueOnce(task);

    vi.spyOn(Task, "findById").mockReturnValue(query);

    updateTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(task.title).toBe("Admin Updated Task");
    expect(task.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Task updated successfully",
      }),
    );
  });
});

describe("deleteTask", () => {
  it("should throw 404 when task does not exist", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      user: {
        id: "user-1",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    vi.spyOn(Task, "findById").mockResolvedValue(null);

    deleteTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Task not found",
        statusCode: 404,
      }),
    );
  });

  it("should throw 404 when workspace does not exist", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: "workspace-1",
    };

    vi.spyOn(Task, "findById").mockResolvedValue(task);
    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    deleteTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should throw 403 when requester is not workspace owner or admin", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      user: {
        id: "user-2",
        role: "member",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: "workspace-1",
    };

    const workspace = {
      _id: "workspace-1",
      owner: "user-1",
    };

    vi.spyOn(Task, "findById").mockResolvedValue(task);
    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);

    deleteTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Not authorized to delete task",
        statusCode: 403,
      }),
    );
  });

  it("should delete the task successfully when requester is workspace owner", async () => {
    const req = {
      params: {
        taskId: "task-1",
      },
      user: {
        id: "user-1",
        role: "manager",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const task = {
      _id: "task-1",
      workspace: "workspace-1",
      deleteOne: vi.fn().mockResolvedValue(undefined),
    };

    const workspace = {
      _id: "workspace-1",
      owner: "user-1",
    };

    vi.spyOn(Task, "findById").mockResolvedValue(task);
    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);

    deleteTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(task.deleteOne).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Task deleted successfully",
    });
  });

  it("should allow admin to delete the task", async () => {
    const req = {
      params: {
        taskId: "task-1",
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

    const task = {
      _id: "task-1",
      workspace: "workspace-1",
      deleteOne: vi.fn().mockResolvedValue(undefined),
    };

    const workspace = {
      _id: "workspace-1",
      owner: "user-1",
    };

    vi.spyOn(Task, "findById").mockResolvedValue(task);
    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);

    deleteTask(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(task.deleteOne).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Task deleted successfully",
    });
  });
});
