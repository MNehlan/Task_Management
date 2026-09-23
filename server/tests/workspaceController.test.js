import { describe, it, vi, expect } from "vitest";
import {
  createWorkspace,
  getWorkspace,
  getSingleWorkspace,
  deleteWorkspace,
  updateWorkspace,
  leaveWorkspace,
  inviteMember,
  getWorkspaceMembers,
  removeMember,
} from "../controllers/workspaceController";
import Workspace from "../models/Workspace";
import Task from "../models/Task";
import User from "../models/User";

describe("createWorkspace", () => {
  it("should pass an error to next when required fields are missing", async () => {
    const req = {
      body: {},
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    createWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "All fields required",
        statusCode: 400,
      }),
    );
  });

  it("should pass an error to next when name or description is only whitespace", async () => {
    const req = {
      body: {
        name: "   ",
        description: "Valid description",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    createWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "All fields required",
        statusCode: 400,
      }),
    );
  });

  it("should pass an error to next when workspace already exists", async () => {
    const req = {
      body: {
        name: "My Workspace",
        description: "My description",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findOne").mockResolvedValue({
      _id: "existing-workspace",
    });

    createWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findOne).toHaveBeenCalledWith({
      name: "My Workspace",
      owner: "123",
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace already exists",
        statusCode: 409,
      }),
    );
  });

  it("should create a workspace successfully", async () => {
    const req = {
      body: {
        name: "My Workspace",
        description: "My description",
      },
      user: {
        id: "123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const createdWorkspace = {
      _id: "workspace-1",
      name: "My Workspace",
      description: "My description",
      owner: "123",
      members: ["123"],
    };

    vi.spyOn(Workspace, "findOne").mockResolvedValue(null);
    vi.spyOn(Workspace, "create").mockResolvedValue(createdWorkspace);

    createWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findOne).toHaveBeenCalledWith({
      name: "My Workspace",
      owner: "123",
    });

    expect(Workspace.create).toHaveBeenCalledWith({
      name: "My Workspace",
      description: "My description",
      owner: "123",
      members: ["123"],
    });

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspace: createdWorkspace,
      message: "Workspace created successfully",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass database errors to next", async () => {
    const req = {
      body: {
        name: "My Workspace",
        description: "My description",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    const databaseError = new Error("Database failure");

    vi.spyOn(Workspace, "findOne").mockRejectedValue(databaseError);

    createWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});

describe("getWorkspace", () => {
  it("should return workspaces belonging to the user", async () => {
    const req = {
      user: {
        id: "123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspaces = [
      { _id: "workspace-1", name: "Workspace One" },
      { _id: "workspace-2", name: "Workspace Two" },
    ];

    vi.spyOn(Workspace, "find").mockResolvedValue(workspaces);

    getWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.find).toHaveBeenCalledWith({
      members: "123",
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspaces,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("getSingleWorkspace", () => {
  it("should pass an error to next when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    getSingleWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should pass an error to next when user is not a workspace member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      members: ["456", "789"],
    });

    getSingleWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should return the workspace when user is a member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspace = {
      _id: "workspace-1",
      name: "My Workspace",
      description: "My description",
      members: ["456", "123"],
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);

    getSingleWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspace,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("deleteWorkspace", () => {
  it("should pass an error to next when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    deleteWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should pass an error to next when user is not allowed to delete the workspace", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "456",
    });

    deleteWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should delete workspace and its tasks when user is the owner", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const deleteOne = vi.fn().mockResolvedValue({});

    const workspace = {
      _id: "workspace-1",
      owner: "123",
      deleteOne,
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);
    vi.spyOn(Task, "deleteMany").mockResolvedValue({ deletedCount: 2 });

    deleteWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.deleteMany).toHaveBeenCalledWith({
      workspace: "workspace-1",
    });

    expect(deleteOne).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Workspace deleted successfully",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should allow an admin to delete a workspace", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "999",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const deleteOne = vi.fn().mockResolvedValue({});

    const workspace = {
      _id: "workspace-1",
      owner: "123",
      deleteOne,
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);
    vi.spyOn(Task, "deleteMany").mockResolvedValue({ deletedCount: 2 });

    deleteWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.deleteMany).toHaveBeenCalledWith({
      workspace: "workspace-1",
    });

    expect(deleteOne).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Workspace deleted successfully",
    });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("updateWorkspace", () => {
  it("should pass an error to next when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        name: "Updated Workspace",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    updateWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should pass an error to next when user is not allowed to update the workspace", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        name: "Updated Workspace",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      name: "Old Workspace",
      description: "Old description",
      owner: "456",
    });

    updateWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should pass an error to next when no changes are detected", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        name: "My Workspace",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      name: "My Workspace",
      description: "My description",
      owner: "123",
    });

    updateWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "No changes detected",
        statusCode: 400,
      }),
    );
  });

  it("should update the workspace successfully", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        name: "Updated Workspace",
        description: "Updated description",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspace = {
      _id: "workspace-1",
      name: "Old Workspace",
      description: "Old description",
      owner: "123",
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);

    updateWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(workspace.name).toBe("Updated Workspace");
    expect(workspace.description).toBe("Updated description");

    expect(workspace.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      workspace: {
        id: "workspace-1",
        name: "Updated Workspace",
        description: "Updated description",
      },
      message: "Workspace updated successfully",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass database errors to next", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        name: "Updated Workspace",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    const databaseError = new Error("Database failure");

    const workspace = {
      _id: "workspace-1",
      name: "Old Workspace",
      description: "Old description",
      owner: "123",
      save: vi.fn().mockRejectedValue(databaseError),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);

    updateWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(workspace.save).toHaveBeenCalled();

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});

describe("leaveWorkspace", () => {
  it("should pass an error to next when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    leaveWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should pass an error when user is not a workspace member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "456",
      members: ["456", "789"],
    });

    leaveWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Not a member of this workspace",
        statusCode: 404,
      }),
    );
  });

  it("should prevent the workspace owner from leaving", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "123",
      members: ["123", "456"],
    });

    leaveWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Owner cannot leave",
        statusCode: 409,
      }),
    );
  });

  it("should prevent a member from leaving when they have active tasks", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "456",
      members: ["456", "123"],
    });

    vi.spyOn(Task, "countDocuments").mockResolvedValue(2);

    leaveWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.countDocuments).toHaveBeenCalledWith({
      workspace: "workspace-1",
      assignedTo: "123",
      status: { $ne: "Completed" },
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Complete or reassign your active tasks before leaving the workspace",
        statusCode: 409,
      }),
    );
  });

  it("should allow a member to leave when they have no active tasks", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspace = {
      _id: "workspace-1",
      owner: "456",
      members: ["456", "123"],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);
    vi.spyOn(Task, "countDocuments").mockResolvedValue(0);

    leaveWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Task.countDocuments).toHaveBeenCalledWith({
      workspace: "workspace-1",
      assignedTo: "123",
      status: { $ne: "Completed" },
    });

    expect(workspace.members).toEqual(["456"]);

    expect(workspace.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "You left the workspace",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass database errors to next", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    const databaseError = new Error("Database failure");

    vi.spyOn(Workspace, "findById").mockRejectedValue(databaseError);

    leaveWorkspace(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});

describe("inviteMember", () => {
  it("should pass an error when email is missing", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {},
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Email is required",
        statusCode: 400,
      }),
    );
  });

  it("should reject an invalid email", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        email: "invalid-email",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid email format",
        statusCode: 400,
      }),
    );
  });

  it("should pass an error when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        email: "user@example.com",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should reject a user who is not allowed to invite members", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        email: "user@example.com",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "456",
      members: ["456"],
    });

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should pass an error when invited user does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        email: "user@example.com",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "123",
      members: ["123"],
    });

    vi.spyOn(User, "findOne").mockResolvedValue(null);

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findOne).toHaveBeenCalledWith({
      email: "user@example.com",
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      }),
    );
  });

  it("should reject a user who is already a member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        email: "member@example.com",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "123",
      members: ["123", "456"],
    });

    vi.spyOn(User, "findOne").mockResolvedValue({
      _id: "456",
      name: "Existing Member",
      email: "member@example.com",
      role: "user",
    });

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User is already a member",
        statusCode: 409,
      }),
    );
  });

  it("should invite a new member successfully", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        email: "  NEWUSER@EXAMPLE.COM  ",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const user = {
      _id: "456",
      name: "New User",
      email: "newuser@example.com",
      role: "user",
    };

    const workspace = {
      _id: "workspace-1",
      owner: "123",
      members: ["123"],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);
    vi.spyOn(User, "findOne").mockResolvedValue(user);

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findOne).toHaveBeenCalledWith({
      email: "newuser@example.com",
    });

    expect(workspace.members).toEqual(["123", "456"]);

    expect(workspace.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      member: {
        id: "456",
        name: "New User",
        email: "newuser@example.com",
        role: "user",
      },
      message: "User added",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should allow an admin to invite a member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        email: "user@example.com",
      },
      user: {
        id: "999",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const user = {
      _id: "456",
      name: "New User",
      email: "user@example.com",
      role: "user",
    };

    const workspace = {
      _id: "workspace-1",
      owner: "123",
      members: ["123"],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);
    vi.spyOn(User, "findOne").mockResolvedValue(user);

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(workspace.members).toContain("456");
    expect(workspace.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass database errors to next", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      body: {
        email: "user@example.com",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    const databaseError = new Error("Database failure");

    vi.spyOn(Workspace, "findById").mockRejectedValue(databaseError);

    inviteMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});

describe("getWorkspaceMembers", () => {
  it("should pass an error when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    const populate = vi.fn().mockResolvedValue(null);

    vi.spyOn(Workspace, "findById").mockReturnValue({
      populate,
    });

    getWorkspaceMembers(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(populate).toHaveBeenCalledWith("members", "name email role");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should deny access to a non-member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    const populate = vi.fn().mockResolvedValue({
      _id: "workspace-1",
      members: [
        {
          _id: "456",
          name: "Other User",
          email: "other@example.com",
          role: "user",
        },
      ],
    });

    vi.spyOn(Workspace, "findById").mockReturnValue({
      populate,
    });

    getWorkspaceMembers(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should return members when the user is a member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const members = [
      {
        _id: "123",
        name: "Current User",
        email: "current@example.com",
        role: "user",
      },
      {
        _id: "456",
        name: "Other User",
        email: "other@example.com",
        role: "user",
      },
    ];

    const populate = vi.fn().mockResolvedValue({
      _id: "workspace-1",
      members,
    });

    vi.spyOn(Workspace, "findById").mockReturnValue({
      populate,
    });

    getWorkspaceMembers(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      members,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should allow an admin to view workspace members", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "999",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const members = [
      {
        _id: "123",
        name: "Workspace User",
        email: "user@example.com",
        role: "user",
      },
    ];

    const populate = vi.fn().mockResolvedValue({
      _id: "workspace-1",
      members,
    });

    vi.spyOn(Workspace, "findById").mockReturnValue({
      populate,
    });

    getWorkspaceMembers(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      members,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass database errors to next", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    const databaseError = new Error("Database failure");

    vi.spyOn(Workspace, "findById").mockImplementation(() => {
      throw databaseError;
    });

    getWorkspaceMembers(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});

describe("removeMember", () => {
  it("should pass an error when workspace does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
        userId: "456",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue(null);

    removeMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(Workspace.findById).toHaveBeenCalledWith("workspace-1");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Workspace not found",
        statusCode: 404,
      }),
    );
  });

  it("should deny a user who is not allowed to remove members", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
        userId: "789",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "456",
      members: ["456", "789"],
    });

    removeMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Access denied",
        statusCode: 403,
      }),
    );
  });

  it("should pass an error when user to remove does not exist", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
        userId: "789",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "123",
      members: ["123", "789"],
    });

    vi.spyOn(User, "findById").mockResolvedValue(null);

    removeMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findById).toHaveBeenCalledWith("789");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      }),
    );
  });

  it("should prevent the workspace owner from being removed", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
        userId: "123",
      },
      user: {
        id: "123",
        role: "manager",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "123",
      members: ["123", "456"],
    });

    vi.spyOn(User, "findById").mockResolvedValue({
      _id: "123",
      name: "Owner",
      email: "owner@example.com",
      role: "user",
    });

    removeMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Owner cannot be removed",
        statusCode: 400,
      }),
    );
  });

  it("should reject removing a user who is not a workspace member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
        userId: "789",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(Workspace, "findById").mockResolvedValue({
      _id: "workspace-1",
      owner: "123",
      members: ["123", "456"],
    });

    vi.spyOn(User, "findById").mockResolvedValue({
      _id: "789",
      name: "Not Member",
      email: "user@example.com",
      role: "user",
    });

    removeMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User is not a member",
        statusCode: 409,
      }),
    );
  });

  it("should remove a member successfully", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
        userId: "789",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspace = {
      _id: "workspace-1",
      owner: "123",
      members: ["123", "789", "456"],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);

    vi.spyOn(User, "findById").mockResolvedValue({
      _id: "789",
      name: "Member",
      email: "member@example.com",
      role: "user",
    });

    removeMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findById).toHaveBeenCalledWith("789");

    expect(workspace.members).toEqual(["123", "456"]);

    expect(workspace.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Member removed",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should allow an admin to remove a member", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
        userId: "789",
      },
      user: {
        id: "999",
        role: "admin",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const workspace = {
      _id: "workspace-1",
      owner: "123",
      members: ["123", "789"],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(Workspace, "findById").mockResolvedValue(workspace);

    vi.spyOn(User, "findById").mockResolvedValue({
      _id: "789",
      name: "Member",
      email: "member@example.com",
      role: "user",
    });

    removeMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(workspace.members).toEqual(["123"]);

    expect(workspace.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass database errors to next", async () => {
    const req = {
      params: {
        workspaceId: "workspace-1",
        userId: "789",
      },
      user: {
        id: "123",
        role: "user",
      },
    };

    const res = {};
    const next = vi.fn();

    const databaseError = new Error("Database failure");

    vi.spyOn(Workspace, "findById").mockRejectedValue(databaseError);

    removeMember(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});
