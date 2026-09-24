import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import User from "../../models/User.js";
import Workspace from "../../models/Workspace.js";
import Task from "../../models/Task.js";

const registerAndLogin = async ({
  name,
  email,
  password = "Password123!",
  role = "member",
}) => {
  const registerResponse = await request(app).post("/api/auth/register").send({
    name,
    email,
    password,
  });

  expect(registerResponse.status).toBe(201);

  const userId = registerResponse.body.user.id;

  if (role !== "member") {
    await User.findByIdAndUpdate(userId, { role });
  }

  const loginResponse = await request(app).post("/api/auth/login").send({
    email,
    password,
  });

  expect(loginResponse.status).toBe(200);

  return {
    id: userId,
    token: loginResponse.body.token,
  };
};

const createWorkspace = async ({ ownerId, memberIds = [] }) => {
  return Workspace.create({
    name: `Workspace ${Date.now()}-${Math.random()}`,
    description: "Test workspace",
    owner: ownerId,
    members: [ownerId, ...memberIds],
  });
};

const createTask = async ({
  workspaceId,
  ownerId,
  assignedTo,
  status = "Todo",
}) => {
  return Task.create({
    title: "Test Task",
    description: "Test task description",
    priority: "Medium",
    deadline: new Date(Date.now() + 86400000),
    workspace: workspaceId,
    assignedTo,
    status,
    createdBy: ownerId,
  });
};

/* =========================================================
   POST /api/task/create
========================================================= */

describe("POST /api/task/create", () => {
  it("should allow the workspace owner to create a task", async () => {
    const owner = await registerAndLogin({
      name: "Manager",
      email: "task-create-owner@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const response = await request(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Build dashboard",
        description: "Create the dashboard UI",
        priority: "High",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        workspaceId: workspace._id,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Task created successfully");

    expect(response.body.task.title).toBe("Build dashboard");
    expect(response.body.task.description).toBe("Create the dashboard UI");
    expect(response.body.task.priority).toBe("High");
    expect(response.body.task.status).toBe("Todo");
    expect(response.body.task.createdBy.id).toBe(owner.id);
    expect(response.body.task.workspace.id).toBe(workspace._id.toString());
  });

  it("should reject a member from creating a task", async () => {
    const member = await registerAndLogin({
      name: "Member",
      email: "task-create-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: member.id,
    });

    const response = await request(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        title: "Task",
        description: "Description",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        workspaceId: workspace._id,
      });

    expect(response.status).toBe(403);
  });

  it("should reject a manager who does not own the workspace", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-create-workspace-owner@test.com",
      role: "manager",
    });

    const manager = await registerAndLogin({
      name: "Manager",
      email: "task-create-other-manager@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [manager.id],
    });

    const response = await request(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({
        title: "Task",
        description: "Description",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        workspaceId: workspace._id,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should return 404 when the workspace does not exist", async () => {
    const manager = await registerAndLogin({
      name: "Manager",
      email: "task-create-no-workspace@test.com",
      role: "manager",
    });

    const fakeWorkspaceId = new Workspace()._id;

    const response = await request(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({
        title: "Task",
        description: "Description",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        workspaceId: fakeWorkspaceId,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Workspace not found");
  });

  it("should reject assigning a task to a user who is not a workspace member", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-create-owner-assignment@test.com",
      role: "manager",
    });

    const outsider = await registerAndLogin({
      name: "Outsider",
      email: "task-create-outsider@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const response = await request(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Task",
        description: "Description",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        workspaceId: workspace._id,
        assignedTo: outsider.id,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "User is not a member of this workspace",
    );
  });

  it("should reject assigning a task to the creator themselves", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-create-self@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const response = await request(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Task",
        description: "Description",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        workspaceId: workspace._id,
        assignedTo: owner.id,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "You cannot assign a task to yourself. Please assign it to another workspace member.",
    );
  });

  it("should reject the request when required fields are missing", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-create-required@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const response = await request(app)
      .post("/api/task/create")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Task",
        workspaceId: workspace._id,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("All fields required");
  });
});

/* =========================================================
   GET /api/task/workspace/:workspaceId
========================================================= */

describe("GET /api/task/workspace/:workspaceId", () => {
  it("should return tasks belonging to a workspace member", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-get-workspace-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "task-get-workspace-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      status: "Completed",
    });

    const response = await request(app)
      .get(`/api/task/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${member.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.tasks).toHaveLength(2);

    expect(response.body.tasks[0]).toHaveProperty("title");
    expect(response.body.tasks[0]).toHaveProperty("description");
    expect(response.body.tasks[0]).toHaveProperty("workspace");
  });

  it("should allow an admin to view tasks even when they are not a workspace member", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-get-workspace-admin-owner@test.com",
      role: "manager",
    });

    const admin = await registerAndLogin({
      name: "Admin",
      email: "task-get-workspace-admin@test.com",
      role: "admin",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .get(`/api/task/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.tasks).toHaveLength(1);
  });

  it("should reject a user who is not a workspace member", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-get-workspace-nonmember-owner@test.com",
      role: "manager",
    });

    const outsider = await registerAndLogin({
      name: "Outsider",
      email: "task-get-workspace-outsider@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const response = await request(app)
      .get(`/api/task/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${outsider.token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "User is not a member of this workspace",
    );
  });

  it("should return 404 when the workspace does not exist", async () => {
    const user = await registerAndLogin({
      name: "User",
      email: "task-get-workspace-missing@test.com",
    });

    const fakeWorkspaceId = new Workspace()._id;

    const response = await request(app)
      .get(`/api/task/workspace/${fakeWorkspaceId}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Workspace not found");
  });
});

/* =========================================================
   PATCH /api/task/:taskId
========================================================= */

describe("PATCH /api/task/:taskId", () => {
  it("should allow the assigned member to update task status", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-status-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Assigned Member",
      email: "task-status-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      assignedTo: member.id,
    });

    const response = await request(app)
      .patch(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        status: "In Progress",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.task.status).toBe("In Progress");
    expect(response.body.message).toBe("Task status updated successfully");
  });

  it("should allow the workspace owner to update task status", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-status-owner-update@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .patch(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        status: "Review",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("Review");
  });

  it("should allow an admin to update task status", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-status-admin-owner@test.com",
      role: "manager",
    });

    const admin = await registerAndLogin({
      name: "Admin",
      email: "task-status-admin@test.com",
      role: "admin",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .patch(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        status: "Completed",
      });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe("Completed");
  });

  it("should reject a workspace member who is not assigned to the task", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-status-unassigned-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "task-status-unassigned-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .patch(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        status: "In Progress",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Not authorized to update task status");
  });

  it("should reject a non-member from updating task status", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-status-nonmember-owner@test.com",
      role: "manager",
    });

    const outsider = await registerAndLogin({
      name: "Outsider",
      email: "task-status-nonmember@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .patch(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${outsider.token}`)
      .send({
        status: "Completed",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should reject the request when status is missing", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-status-missing@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .patch(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Status is required");
  });

  it("should reject an invalid status", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-status-invalid@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .patch(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        status: "Invalid Status",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Not a valid status");
  });

  it("should return 404 when the task does not exist", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-status-missing-task@test.com",
      role: "manager",
    });

    const fakeTaskId = new Task()._id;

    const response = await request(app)
      .patch(`/api/task/${fakeTaskId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        status: "Completed",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task not found");
  });
});

/* =========================================================
   GET /api/task/:taskId
========================================================= */

describe("GET /api/task/:taskId", () => {
  it("should allow a workspace member to view a task", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-get-id-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "task-get-id-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      assignedTo: member.id,
    });

    const response = await request(app)
      .get(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${member.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.task.id).toBe(task._id.toString());
    expect(response.body.task.title).toBe("Test Task");
    expect(response.body.task.assignedTo.id).toBe(member.id);
    expect(response.body.task.createdBy.id).toBe(owner.id);
    expect(response.body.task.workspace.id).toBe(workspace._id.toString());
  });

  it("should allow an admin to view a task outside their workspace", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-get-id-admin-owner@test.com",
      role: "manager",
    });

    const admin = await registerAndLogin({
      name: "Admin",
      email: "task-get-id-admin@test.com",
      role: "admin",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .get(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.task.id).toBe(task._id.toString());
  });

  it("should reject a non-member from viewing a task", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-get-id-nonmember-owner@test.com",
      role: "manager",
    });

    const outsider = await registerAndLogin({
      name: "Outsider",
      email: "task-get-id-outsider@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .get(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${outsider.token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should return 404 when the task does not exist", async () => {
    const user = await registerAndLogin({
      name: "User",
      email: "task-get-id-missing@test.com",
    });

    const fakeTaskId = new Task()._id;

    const response = await request(app)
      .get(`/api/task/${fakeTaskId}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task not found");
  });
});

/* =========================================================
   PUT /api/task/:taskId
========================================================= */

describe("PUT /api/task/:taskId", () => {
  it("should allow the workspace owner to update a task", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-owner@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .put(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Updated Task",
        description: "Updated description",
        priority: "High",
        deadline: new Date(Date.now() + 172800000).toISOString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Task updated successfully");

    expect(response.body.task.title).toBe("Updated Task");
    expect(response.body.task.description).toBe("Updated description");
    expect(response.body.task.priority).toBe("High");
  });

  it("should allow the workspace owner to assign the task to a member", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-assign-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "task-update-assign-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .put(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        assignedTo: member.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.task.assignedTo.id).toBe(member.id);
    expect(response.body.task.assignedTo.name).toBe("Member");
  });

  it("should reject a manager who does not own the workspace", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-other-owner@test.com",
      role: "manager",
    });

    const manager = await registerAndLogin({
      name: "Manager",
      email: "task-update-other-manager@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [manager.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .put(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({
        title: "Unauthorized update",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Not authorized");
  });

  it("should reject a member from updating a task", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-member-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "task-update-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .put(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        title: "Unauthorized update",
      });

    expect(response.status).toBe(403);
  });

  it("should reject assigning the task to the current user", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-self@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .put(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        assignedTo: owner.id,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "You cannot assign a task to yourself. Please assign it to another workspace member.",
    );
  });

  it("should return 404 when the assigned user does not exist", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-missing-user@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const fakeUserId = new User()._id;

    const response = await request(app)
      .put(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        assignedTo: fakeUserId,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Assigned user not found");
  });

  it("should reject assigning the task to a non-member", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-nonmember-owner@test.com",
      role: "manager",
    });

    const outsider = await registerAndLogin({
      name: "Outsider",
      email: "task-update-nonmember@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .put(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        assignedTo: outsider.id,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "User is not a member of this workspace",
    );
  });

  it("should reject an invalid deadline", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-deadline@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .put(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        deadline: "not-a-valid-date",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid deadline format");
  });

  it("should return 404 when the task does not exist", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-update-missing-task@test.com",
      role: "manager",
    });

    const fakeTaskId = new Task()._id;

    const response = await request(app)
      .put(`/api/task/${fakeTaskId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Updated",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task not found");
  });
});

/* =========================================================
   DELETE /api/task/:taskId
========================================================= */

describe("DELETE /api/task/:taskId", () => {
  it("should allow the workspace owner to delete a task", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-delete-owner@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .delete(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Task deleted successfully");

    const deletedTask = await Task.findById(task._id);

    expect(deletedTask).toBeNull();
  });

  it("should reject a manager who does not own the workspace", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-delete-other-owner@test.com",
      role: "manager",
    });

    const manager = await registerAndLogin({
      name: "Manager",
      email: "task-delete-other-manager@test.com",
      role: "manager",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [manager.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .delete(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${manager.token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Not authorized to delete task");

    const existingTask = await Task.findById(task._id);

    expect(existingTask).not.toBeNull();
  });

  it("should reject a member from deleting a task", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-delete-member-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "task-delete-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .delete(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${member.token}`);

    expect(response.status).toBe(403);

    const existingTask = await Task.findById(task._id);

    expect(existingTask).not.toBeNull();
  });

  it("should allow an admin to delete a task", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-delete-admin-owner@test.com",
      role: "manager",
    });

    const admin = await registerAndLogin({
      name: "Admin",
      email: "task-delete-admin@test.com",
      role: "admin",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
    });

    const response = await request(app)
      .delete(`/api/task/${task._id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Task deleted successfully");

    const deletedTask = await Task.findById(task._id);

    expect(deletedTask).toBeNull();
  });

  it("should return 404 when the task does not exist", async () => {
    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-delete-missing@test.com",
      role: "manager",
    });

    const fakeTaskId = new Task()._id;

    const response = await request(app)
      .delete(`/api/task/${fakeTaskId}`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task not found");
  });
});
