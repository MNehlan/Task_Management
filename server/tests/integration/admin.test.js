import { describe, it, expect } from "vitest";
import request from "supertest";
import User from "../../models/User.js";
import Workspace from "../../models/Workspace.js";
import Task from "../../models/Task.js";
import app from "../../app.js";

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

const createWorkspace = async ({
  ownerId,
  memberIds = [],
  name = "Admin Test Workspace",
}) => {
  return Workspace.create({
    name: `${name}-${Date.now()}-${Math.random()}`,
    description: "Admin test workspace",
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
    title: "Admin Test Task",
    description: "Admin test task description",
    priority: "Medium",
    deadline: new Date(Date.now() + 86400000),
    workspace: workspaceId,
    assignedTo,
    status,
    createdBy: ownerId,
  });
};

/* =========================================================
   GET /api/admin
========================================================= */

describe("GET /api/admin", () => {
  it("should return dashboard statistics for an admin", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "dashboard-admin@test.com",
      role: "admin",
    });

    const owner = await registerAndLogin({
      name: "Owner",
      email: "dashboard-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "dashboard-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      assignedTo: member.id,
      status: "Todo",
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      status: "In Progress",
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      status: "Review",
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      status: "Completed",
    });

    const response = await request(app)
      .get("/api/admin")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.stats).toMatchObject({
      users: 3,
      workspaces: 1,
      tasks: 4,
      todo: 1,
      inProgress: 1,
      review: 1,
      completed: 1,
    });
  });

  it("should reject a non-admin user", async () => {
    const user = await registerAndLogin({
      name: "Member",
      email: "dashboard-member-reject@test.com",
    });

    const response = await request(app)
      .get("/api/admin")
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(403);
  });
});

/* =========================================================
   GET /api/admin/workspaces
========================================================= */

describe("GET /api/admin/workspaces", () => {
  it("should return all workspaces with owner, member count, and task count", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "all-workspaces-admin@test.com",
      role: "admin",
    });

    const owner = await registerAndLogin({
      name: "Owner",
      email: "all-workspaces-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "all-workspaces-member@test.com",
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
    });

    const response = await request(app)
      .get("/api/admin/workspaces")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.workspaces).toHaveLength(1);

    expect(response.body.workspaces[0]).toMatchObject({
      id: workspace._id.toString(),
      name: workspace.name,
      description: workspace.description,
      memberCount: 2,
      taskCount: 2,
      owner: {
        id: owner.id,
        name: "Owner",
        email: "all-workspaces-owner@test.com",
      },
    });
  });

  it("should reject a non-admin user", async () => {
    const user = await registerAndLogin({
      name: "Member",
      email: "all-workspaces-reject@test.com",
    });

    const response = await request(app)
      .get("/api/admin/workspaces")
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(403);
  });
});

/* =========================================================
   GET /api/admin/workspaces/:workspaceId
========================================================= */

describe("GET /api/admin/workspaces/:workspaceId", () => {
  it("should return workspace details, members, and tasks", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "workspace-detail-admin@test.com",
      role: "admin",
    });

    const owner = await registerAndLogin({
      name: "Owner",
      email: "workspace-detail-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "workspace-detail-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      assignedTo: member.id,
      status: "In Progress",
    });

    const response = await request(app)
      .get(`/api/admin/workspaces/${workspace._id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.workspace.id).toBe(workspace._id.toString());

    expect(response.body.workspace.owner).toMatchObject({
      id: owner.id,
      name: "Owner",
      email: "workspace-detail-owner@test.com",
    });

    expect(response.body.workspace.members).toHaveLength(2);

    expect(response.body.workspace.tasks).toHaveLength(1);

    expect(response.body.workspace.tasks[0]).toMatchObject({
      id: task._id.toString(),
      title: "Admin Test Task",
      status: "In Progress",
      assignedTo: {
        id: member.id,
        name: "Member",
        email: "workspace-detail-member@test.com",
      },
    });
  });

  it("should return 404 when the workspace does not exist", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "workspace-detail-missing-admin@test.com",
      role: "admin",
    });

    const fakeWorkspaceId = new Workspace()._id;

    const response = await request(app)
      .get(`/api/admin/workspaces/${fakeWorkspaceId}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Workspace not found");
  });

  it("should reject a non-admin user", async () => {
    const user = await registerAndLogin({
      name: "Member",
      email: "workspace-detail-reject@test.com",
    });

    const fakeWorkspaceId = new Workspace()._id;

    const response = await request(app)
      .get(`/api/admin/workspaces/${fakeWorkspaceId}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(403);
  });
});

/* =========================================================
   GET /api/admin/tasks
========================================================= */

describe("GET /api/admin/tasks", () => {
  it("should return all tasks", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "all-tasks-admin@test.com",
      role: "admin",
    });

    const owner = await registerAndLogin({
      name: "Owner",
      email: "all-tasks-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "all-tasks-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      assignedTo: member.id,
    });

    await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      status: "Completed",
    });

    const response = await request(app)
      .get("/api/admin/tasks")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.tasks).toHaveLength(2);

    expect(response.body.tasks[0]).toHaveProperty("id");
    expect(response.body.tasks[0]).toHaveProperty("title");
    expect(response.body.tasks[0]).toHaveProperty("workspace");
    expect(response.body.tasks[0]).toHaveProperty("createdBy");
  });

  it("should reject a non-admin user", async () => {
    const user = await registerAndLogin({
      name: "Member",
      email: "all-tasks-reject@test.com",
    });

    const response = await request(app)
      .get("/api/admin/tasks")
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(403);
  });
});

/* =========================================================
   GET /api/admin/tasks/:taskId
========================================================= */

describe("GET /api/admin/tasks/:taskId", () => {
  it("should return a task by id", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "task-detail-admin@test.com",
      role: "admin",
    });

    const owner = await registerAndLogin({
      name: "Owner",
      email: "task-detail-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "task-detail-member@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const task = await createTask({
      workspaceId: workspace._id,
      ownerId: owner.id,
      assignedTo: member.id,
      status: "Completed",
    });

    const response = await request(app)
      .get(`/api/admin/tasks/${task._id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.task).toMatchObject({
      id: task._id.toString(),
      title: "Admin Test Task",
      description: "Admin test task description",
      priority: "Medium",
      status: "Completed",
      assignedTo: {
        id: member.id,
        name: "Member",
        email: "task-detail-member@test.com",
      },
      createdBy: {
        id: owner.id,
        name: "Owner",
        email: "task-detail-owner@test.com",
      },
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
      },
    });
  });

  it("should return 404 when the task does not exist", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "task-detail-missing-admin@test.com",
      role: "admin",
    });

    const fakeTaskId = new Task()._id;

    const response = await request(app)
      .get(`/api/admin/tasks/${fakeTaskId}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Task not found");
  });

  it("should reject a non-admin user", async () => {
    const user = await registerAndLogin({
      name: "Member",
      email: "task-detail-reject@test.com",
    });

    const fakeTaskId = new Task()._id;

    const response = await request(app)
      .get(`/api/admin/tasks/${fakeTaskId}`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(403);
  });
});

/* =========================================================
   GET /api/admin/users
========================================================= */

describe("GET /api/admin/users", () => {
  it("should return all users without passwords", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "all-users-admin@test.com",
      role: "admin",
    });

    await registerAndLogin({
      name: "Manager",
      email: "all-users-manager@test.com",
      role: "manager",
    });

    await registerAndLogin({
      name: "Member",
      email: "all-users-member@test.com",
    });

    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.users).toHaveLength(3);

    for (const user of response.body.users) {
      expect(user).not.toHaveProperty("password");
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("createdAt");
    }
  });

  it("should reject a non-admin user", async () => {
    const user = await registerAndLogin({
      name: "Member",
      email: "all-users-reject@test.com",
    });

    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(403);
  });
});

/* =========================================================
   PATCH /api/admin/users/:userId/role
========================================================= */

describe("PATCH /api/admin/users/:userId/role", () => {
  it("should allow an admin to promote a member to manager", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "role-admin@test.com",
      role: "admin",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "role-member@test.com",
    });

    const response = await request(app)
      .patch(`/api/admin/users/${member.id}/role`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        role: "manager",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.user).toMatchObject({
      id: member.id,
      name: "Member",
      email: "role-member@test.com",
      role: "manager",
    });

    const updatedUser = await User.findById(member.id);

    expect(updatedUser.role).toBe("manager");
  });

  it("should allow an admin to change a manager to member", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "role-demote-admin@test.com",
      role: "admin",
    });

    const manager = await registerAndLogin({
      name: "Manager",
      email: "role-demote-manager@test.com",
      role: "manager",
    });

    const response = await request(app)
      .patch(`/api/admin/users/${manager.id}/role`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        role: "member",
      });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("member");
  });

  it("should reject an admin trying to change their own role", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "role-self-admin@test.com",
      role: "admin",
    });

    const response = await request(app)
      .patch(`/api/admin/users/${admin.id}/role`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        role: "member",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("You cannot change your own role");
  });

  it("should reject an invalid role", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "role-invalid-admin@test.com",
      role: "admin",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "role-invalid-member@test.com",
    });

    const response = await request(app)
      .patch(`/api/admin/users/${member.id}/role`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        role: "superuser",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid role");
  });

  it("should return 404 when the target user does not exist", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "role-missing-admin@test.com",
      role: "admin",
    });

    const fakeUserId = new User()._id;

    const response = await request(app)
      .patch(`/api/admin/users/${fakeUserId}/role`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        role: "manager",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("should reject a non-admin user", async () => {
    const member = await registerAndLogin({
      name: "Member",
      email: "role-reject-member@test.com",
    });

    const target = await registerAndLogin({
      name: "Target",
      email: "role-reject-target@test.com",
    });

    const response = await request(app)
      .patch(`/api/admin/users/${target.id}/role`)
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        role: "manager",
      });

    expect(response.status).toBe(403);
  });
});

/* =========================================================
   DELETE /api/admin/users/:userId
========================================================= */

describe("DELETE /api/admin/users/:userId", () => {
  it("should allow an admin to delete a user", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "delete-user-admin@test.com",
      role: "admin",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "delete-user-member@test.com",
    });

    const response = await request(app)
      .delete(`/api/admin/users/${member.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User deleted successfully");

    const deletedUser = await User.findById(member.id);

    expect(deletedUser).toBeNull();
  });

  it("should reject an admin from deleting their own account", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "delete-self-admin@test.com",
      role: "admin",
    });

    const response = await request(app)
      .delete(`/api/admin/users/${admin.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("You cannot delete your own account");

    const existingAdmin = await User.findById(admin.id);

    expect(existingAdmin).not.toBeNull();
  });

  it("should reject deleting a user who owns a workspace", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "delete-owner-admin@test.com",
      role: "admin",
    });

    const owner = await registerAndLogin({
      name: "Owner",
      email: "delete-owner-user@test.com",
      role: "manager",
    });

    await createWorkspace({
      ownerId: owner.id,
    });

    const response = await request(app)
      .delete(`/api/admin/users/${owner.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Cannot delete user. This user owns one or more workspaces. Please delete the workspaces or transfer ownership first.",
    );

    const existingUser = await User.findById(owner.id);

    expect(existingUser).not.toBeNull();
  });

  it("should remove a deleted user from workspace members", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "delete-member-admin@test.com",
      role: "admin",
    });

    const owner = await registerAndLogin({
      name: "Owner",
      email: "delete-member-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "delete-member-user@test.com",
    });

    const workspace = await createWorkspace({
      ownerId: owner.id,
      memberIds: [member.id],
    });

    const response = await request(app)
      .delete(`/api/admin/users/${member.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);

    const updatedWorkspace = await Workspace.findById(workspace._id);

    expect(updatedWorkspace.members.map((id) => id.toString())).not.toContain(
      member.id,
    );
  });

  it("should unassign tasks belonging to a deleted user", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "delete-assignment-admin@test.com",
      role: "admin",
    });

    const owner = await registerAndLogin({
      name: "Owner",
      email: "delete-assignment-owner@test.com",
      role: "manager",
    });

    const member = await registerAndLogin({
      name: "Member",
      email: "delete-assignment-member@test.com",
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
      .delete(`/api/admin/users/${member.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(200);

    const updatedTask = await Task.findById(task._id);

    expect(updatedTask.assignedTo).toBeUndefined();
  }, 10000);

  it("should return 404 when the target user does not exist", async () => {
    const admin = await registerAndLogin({
      name: "Admin",
      email: "delete-missing-admin@test.com",
      role: "admin",
    });

    const fakeUserId = new User()._id;

    const response = await request(app)
      .delete(`/api/admin/users/${fakeUserId}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("should reject a non-admin user", async () => {
    const member = await registerAndLogin({
      name: "Member",
      email: "delete-reject-member@test.com",
    });

    const target = await registerAndLogin({
      name: "Target",
      email: "delete-reject-target@test.com",
    });

    const response = await request(app)
      .delete(`/api/admin/users/${target.id}`)
      .set("Authorization", `Bearer ${member.token}`);

    expect(response.status).toBe(403);

    const existingTarget = await User.findById(target.id);

    expect(existingTarget).not.toBeNull();
  });
});
