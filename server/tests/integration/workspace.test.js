import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import User from "../../models/User.js";
import Workspace from "../../models/Workspace.js";
import Task from "../../models/Task.js";

/* =========================================================
   POST /api/workspace/create
========================================================= */

describe("POST /api/workspace/create", () => {
  it("should allow a manager to create a workspace", async () => {
    const adminRegisterResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Admin",
        email: "workspace-admin@example.com",
        password: "StrongPassword123!",
      });

    const adminId = adminRegisterResponse.body.user.id;

    await User.findByIdAndUpdate(adminId, { role: "admin" }, { new: true });

    const adminLoginResponse = await request(app).post("/api/auth/login").send({
      email: "workspace-admin@example.com",
      password: "StrongPassword123!",
    });

    const adminToken = adminLoginResponse.body.token;

    const managerRegisterResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Manager",
        email: "workspace-manager@example.com",
        password: "StrongPassword123!",
      });

    const managerId = managerRegisterResponse.body.user.id;

    await request(app)
      .patch(`/api/admin/users/${managerId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        role: "manager",
      });

    const managerLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "workspace-manager@example.com",
        password: "StrongPassword123!",
      });

    const managerToken = managerLoginResponse.body.token;

    const response = await request(app)
      .post("/api/workspace/create")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "My Workspace",
        description: "My first workspace",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.workspace.name).toBe("My Workspace");
    expect(response.body.workspace.description).toBe("My first workspace");
  });
});

/* =========================================================
   GET /api/workspace
========================================================= */

describe("GET /api/workspace", () => {
  it("should return workspaces belonging to the authenticated user", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Workspace User",
        email: "workspace@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const userId = registerResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "workspace@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    await Workspace.create({
      name: "User Workspace",
      description: "Workspace for testing",
      owner: userId,
      members: [userId],
    });

    const response = await request(app)
      .get("/api/workspace")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.workspaces).toHaveLength(1);
    expect(response.body.workspaces[0].name).toBe("User Workspace");
  });
});

/* =========================================================
   GET /api/workspace/:workspaceId
========================================================= */

describe("GET /api/workspace/:workspaceId", () => {
  it("should return a workspace when the user is a member", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Workspace Member",
        email: "workspace-member@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const userId = registerResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "workspace-member@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Member Workspace",
      description: "Workspace for member test",
      owner: userId,
      members: [userId],
    });

    const response = await request(app)
      .get(`/api/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.workspace.name).toBe("Member Workspace");
    expect(response.body.workspace.description).toBe(
      "Workspace for member test",
    );
  });

  it("should reject a user who is not a workspace member", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Workspace Owner",
      email: "workspace-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const workspace = await Workspace.create({
      name: "Private Workspace",
      description: "Private workspace",
      owner: ownerId,
      members: [ownerId],
    });

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Non Member",
      email: "non-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "non-member@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .get(`/api/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied");
  });
});

/* =========================================================
   DELETE /api/workspace/:workspaceId
========================================================= */

describe("DELETE /api/workspace/:workspaceId", () => {
  it("should allow the owner to delete a workspace", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Workspace Owner",
        email: "delete-owner@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const ownerId = registerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "delete-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Workspace To Delete",
      description: "Workspace deletion test",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Workspace deleted successfully");

    const deletedWorkspace = await Workspace.findById(workspace._id);

    expect(deletedWorkspace).toBeNull();
  });

  it("should reject a non-owner from deleting the workspace", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Delete Owner",
      email: "delete-owner2@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const workspace = await Workspace.create({
      name: "Protected Workspace",
      description: "Should not be deleted",
      owner: ownerId,
      members: [ownerId],
    });

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Delete Attempt",
      email: "delete-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    await User.findByIdAndUpdate(memberId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "delete-member@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied");

    const existingWorkspace = await Workspace.findById(workspace._id);

    expect(existingWorkspace).not.toBeNull();
  });
});

/* =========================================================
   PATCH /api/workspace/:workspaceId
========================================================= */

describe("PATCH /api/workspace/:workspaceId", () => {
  it("should allow the owner to update a workspace", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Workspace Owner",
        email: "update-owner@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const ownerId = registerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "update-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Original Workspace",
      description: "Original description",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .patch(`/api/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Workspace",
        description: "Updated description",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.workspace.name).toBe("Updated Workspace");
    expect(response.body.workspace.description).toBe("Updated description");

    const updatedWorkspace = await Workspace.findById(workspace._id);

    expect(updatedWorkspace.name).toBe("Updated Workspace");
    expect(updatedWorkspace.description).toBe("Updated description");
  });

  it("should reject a non-owner from updating the workspace", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Update Owner",
      email: "update-owner2@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const workspace = await Workspace.create({
      name: "Protected Workspace",
      description: "Protected description",
      owner: ownerId,
      members: [ownerId],
    });

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Update Member",
      email: "update-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    await User.findByIdAndUpdate(memberId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "update-member@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .patch(`/api/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Unauthorized Update",
        description: "Should not update",
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied");

    const existingWorkspace = await Workspace.findById(workspace._id);

    expect(existingWorkspace.name).toBe("Protected Workspace");
    expect(existingWorkspace.description).toBe("Protected description");
  });

  it("should reject the update when no changes are detected", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "No Change Owner",
        email: "no-change-owner@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const ownerId = registerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "no-change-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Same Workspace",
      description: "Same description",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .patch(`/api/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Same Workspace",
        description: "Same description",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("No changes detected");
  });

  it("should return 404 when the workspace does not exist", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Missing Workspace User",
        email: "missing-workspace@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const userId = registerResponse.body.user.id;

    await User.findByIdAndUpdate(userId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "missing-workspace@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const fakeWorkspaceId = "507f1f77bcf86cd799439011";

    const response = await request(app)
      .patch(`/api/workspace/${fakeWorkspaceId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Workspace",
        description: "Updated description",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Workspace not found");
  });
});

/* =========================================================
   POST /api/workspace/:workspaceId/members
========================================================= */

describe("POST /api/workspace/:workspaceId/members", () => {
  it("should allow the workspace owner to invite an existing user", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Workspace Owner",
      email: "invite-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "New Member",
      email: "new-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "invite-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Team Workspace",
      description: "Workspace for member invitation",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/members`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "new-member@example.com",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.member.id).toBe(memberId);
    expect(response.body.member.email).toBe("new-member@example.com");
    expect(response.body.message).toBe("User added");

    const updatedWorkspace = await Workspace.findById(workspace._id);

    expect(
      updatedWorkspace.members.some((member) => member.toString() === memberId),
    ).toBe(true);
  });

  it("should reject an invalid email format", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Email Owner",
      email: "invalid-email-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "invalid-email-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Email Workspace",
      description: "Email validation test",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/members`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "not-an-email",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email format");
  });

  it("should return 404 when the invited user does not exist", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Missing User Owner",
      email: "missing-user-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "missing-user-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Missing User Workspace",
      description: "Missing user test",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/members`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "does-not-exist@example.com",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("User not found");
  });

  it("should reject a user who is already a workspace member", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Existing Owner",
      email: "existing-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "existing-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Existing Member Workspace",
      description: "Already member test",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/members`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "existing-owner@example.com",
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("User is already a member");
  });

  it("should reject a non-owner from inviting a member", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Invite Owner",
      email: "invite-owner2@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Invite Member",
      email: "invite-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    const targetResponse = await request(app).post("/api/auth/register").send({
      name: "Target User",
      email: "target-user@example.com",
      password: "Password123!",
    });

    expect(targetResponse.status).toBe(201);

    const workspace = await Workspace.create({
      name: "Protected Invite Workspace",
      description: "Invite authorization test",
      owner: ownerId,
      members: [ownerId, memberId],
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "invite-member@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/members`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "target-user@example.com",
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access Denied");
  });
});

/* =========================================================
   GET /api/workspace/:workspaceId/members
========================================================= */

describe("GET /api/workspace/:workspaceId/members", () => {
  it("should return workspace members to a workspace member", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Members Owner",
      email: "members-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Workspace Member",
      email: "workspace-member-list@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "members-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Members Workspace",
      description: "Workspace members test",
      owner: ownerId,
      members: [ownerId, memberId],
    });

    const response = await request(app)
      .get(`/api/workspace/${workspace._id}/members`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.members).toHaveLength(2);

    expect(
      response.body.members.some(
        (member) => member.email === "members-owner@example.com",
      ),
    ).toBe(true);

    expect(
      response.body.members.some(
        (member) => member.email === "workspace-member-list@example.com",
      ),
    ).toBe(true);
  });

  it("should reject a non-member from viewing workspace members", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Members Owner 2",
      email: "members-owner2@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const nonMemberResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Non Member",
        email: "members-nonmember@example.com",
        password: "Password123!",
      });

    expect(nonMemberResponse.status).toBe(201);

    const workspace = await Workspace.create({
      name: "Private Members Workspace",
      description: "Private members test",
      owner: ownerId,
      members: [ownerId],
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "members-nonmember@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .get(`/api/workspace/${workspace._id}/members`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied");
  });
});

/* =========================================================
   DELETE /api/workspace/:workspaceId/members/:userId
========================================================= */

describe("DELETE /api/workspace/:workspaceId/members/:userId", () => {
  it("should allow the workspace owner to remove a member", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Remove Owner",
      email: "remove-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Remove Member",
      email: "remove-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "remove-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Remove Member Workspace",
      description: "Member removal test",
      owner: ownerId,
      members: [ownerId, memberId],
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/members/${memberId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Member removed");

    const updatedWorkspace = await Workspace.findById(workspace._id);

    expect(
      updatedWorkspace.members.some((member) => member.toString() === memberId),
    ).toBe(false);
  });

  it("should return 404 when the workspace does not exist", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Missing Workspace Owner",
        email: "remove-missing-workspace@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const userId = registerResponse.body.user.id;

    await User.findByIdAndUpdate(userId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "remove-missing-workspace@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const fakeWorkspaceId = "507f1f77bcf86cd799439011";
    const fakeUserId = "507f1f77bcf86cd799439012";

    const response = await request(app)
      .delete(`/api/workspace/${fakeWorkspaceId}/members/${fakeUserId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Workspace not found");
  });

  it("should reject a non-owner from removing a member", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Protected Owner",
      email: "remove-protected-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const requesterResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Remove Requester",
        email: "remove-requester@example.com",
        password: "Password123!",
      });

    expect(requesterResponse.status).toBe(201);

    const requesterId = requesterResponse.body.user.id;

    const targetResponse = await request(app).post("/api/auth/register").send({
      name: "Remove Target",
      email: "remove-target@example.com",
      password: "Password123!",
    });

    expect(targetResponse.status).toBe(201);

    const targetId = targetResponse.body.user.id;

    await User.findByIdAndUpdate(
      requesterId,
      { role: "manager" },
      { new: true },
    );

    const workspace = await Workspace.create({
      name: "Protected Remove Workspace",
      description: "Authorization test",
      owner: ownerId,
      members: [ownerId, requesterId, targetId],
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "remove-requester@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/members/${targetId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied");

    const existingWorkspace = await Workspace.findById(workspace._id);

    expect(
      existingWorkspace.members.some(
        (member) => member.toString() === targetId,
      ),
    ).toBe(true);
  });

  it("should return 404 when the target user does not exist", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Target Missing Owner",
      email: "remove-target-missing-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "remove-target-missing-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Missing Target Workspace",
      description: "Missing target test",
      owner: ownerId,
      members: [ownerId],
    });

    const fakeUserId = "507f1f77bcf86cd799439012";

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/members/${fakeUserId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("User not found");
  });

  it("should reject removing the workspace owner", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Owner Protected",
      email: "remove-owner-protected@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "remove-owner-protected@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Owner Protection Workspace",
      description: "Owner removal test",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/members/${ownerId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Owner cannot be removed");

    const existingWorkspace = await Workspace.findById(workspace._id);

    expect(
      existingWorkspace.members.some((member) => member.toString() === ownerId),
    ).toBe(true);
  });

  it("should return 409 when the target user is not a workspace member", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Not Member Owner",
      email: "remove-not-member-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    await User.findByIdAndUpdate(ownerId, { role: "manager" }, { new: true });

    const targetResponse = await request(app).post("/api/auth/register").send({
      name: "Not Member Target",
      email: "remove-not-member-target@example.com",
      password: "Password123!",
    });

    expect(targetResponse.status).toBe(201);

    const targetId = targetResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "remove-not-member-owner@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Not Member Workspace",
      description: "Not member test",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/members/${targetId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("User is not a member");
  });
});

/* =========================================================
   DELETE /api/workspace/:workspaceId/leave
========================================================= */

describe("DELETE /api/workspace/:workspaceId/leave", () => {
  it("should allow a member to leave the workspace", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Leave Owner",
      email: "leave-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Leave Member",
      email: "leave-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "leave-member@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Leave Workspace",
      description: "Workspace for leave test",
      owner: ownerId,
      members: [ownerId, memberId],
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/leave`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("You left the workspace");

    const updatedWorkspace = await Workspace.findById(workspace._id);

    expect(
      updatedWorkspace.members.some((member) => member.toString() === memberId),
    ).toBe(false);

    expect(
      updatedWorkspace.members.some((member) => member.toString() === ownerId),
    ).toBe(true);
  });

  it("should return 404 when the workspace does not exist", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Missing Workspace User",
        email: "leave-missing-workspace@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const userId = registerResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "leave-missing-workspace@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const fakeWorkspaceId = "507f1f77bcf86cd799439011";

    const response = await request(app)
      .delete(`/api/workspace/${fakeWorkspaceId}/leave`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Workspace not found");
  });

  it("should return 404 when the user is not a member", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Leave Owner",
      email: "leave-not-member-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const outsiderResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Leave Outsider",
        email: "leave-outsider@example.com",
        password: "Password123!",
      });

    expect(outsiderResponse.status).toBe(201);

    const outsiderId = outsiderResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "leave-outsider@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Private Leave Workspace",
      description: "Workspace for membership test",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/leave`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Not a member of this workspace");

    expect(outsiderId).toBeDefined();
  });

  it("should return 409 when the owner tries to leave", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Leave Owner Protected",
        email: "leave-owner-protected@example.com",
        password: "Password123!",
      });

    expect(registerResponse.status).toBe(201);

    const ownerId = registerResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "leave-owner-protected@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Owner Leave Workspace",
      description: "Owner cannot leave",
      owner: ownerId,
      members: [ownerId],
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/leave`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(409);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Owner cannot leave");

    const existingWorkspace = await Workspace.findById(workspace._id);

    expect(
      existingWorkspace.members.some((member) => member.toString() === ownerId),
    ).toBe(true);
  });

  it("should return 409 when the member has an active assigned task", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Active Task Owner",
      email: "leave-active-task-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Active Task Member",
      email: "leave-active-task-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "leave-active-task-member@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Active Task Workspace",
      description: "Workspace for active task test",
      owner: ownerId,
      members: [ownerId, memberId],
    });

    await Task.create({
      title: "Active task",
      description: "Task that prevents leaving",
      priority: "Medium",
      deadline: new Date(Date.now() + 86400000),
      workspace: workspace._id,
      assignedTo: memberId,
      status: "In Progress",
      createdBy: ownerId,
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/leave`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(409);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Complete or reassign your active tasks before leaving the workspace",
    );

    const existingWorkspace = await Workspace.findById(workspace._id);

    expect(
      existingWorkspace.members.some(
        (member) => member.toString() === memberId,
      ),
    ).toBe(true);
  });

  it("should allow a member to leave when all their assigned tasks are completed", async () => {
    const ownerResponse = await request(app).post("/api/auth/register").send({
      name: "Completed Task Owner",
      email: "leave-completed-task-owner@example.com",
      password: "Password123!",
    });

    expect(ownerResponse.status).toBe(201);

    const ownerId = ownerResponse.body.user.id;

    const memberResponse = await request(app).post("/api/auth/register").send({
      name: "Completed Task Member",
      email: "leave-completed-task-member@example.com",
      password: "Password123!",
    });

    expect(memberResponse.status).toBe(201);

    const memberId = memberResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "leave-completed-task-member@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.token;

    const workspace = await Workspace.create({
      name: "Completed Task Workspace",
      description: "Workspace for completed task test",
      owner: ownerId,
      members: [ownerId, memberId],
    });

    await Task.create({
      title: "Completed task",
      description: "Completed task should not prevent leaving",
      priority: "Low",
      deadline: new Date(Date.now() + 86400000),
      workspace: workspace._id,
      assignedTo: memberId,
      status: "Completed",
      createdBy: ownerId,
    });

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/leave`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("You left the workspace");

    const updatedWorkspace = await Workspace.findById(workspace._id);

    expect(
      updatedWorkspace.members.some((member) => member.toString() === memberId),
    ).toBe(false);
  });
});
