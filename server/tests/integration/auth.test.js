import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";

/* =========================================================
   POST /api/auth/register
========================================================= */

describe("POST /api/auth/register", () => {
  it("should register a new user successfully", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Peter",
      email: "test@example.com",
      password: "StrongPassword123!",
    });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();

    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: "Peter",
      email: "test@example.com",
      role: "member",
    });

    expect(response.body.message).toBe("User created successfully");
  });

  it("should reject registration when email already exists", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Peter",
      email: "duplicate@example.com",
      password: "StrongPassword123!",
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "Another Peter",
      email: "duplicate@example.com",
      password: "StrongPassword123!",
    });

    expect(response.status).toBe(409);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email already exists");
  });

  it("should reject registration when required fields are missing", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Peter",
      email: "missing@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("All fields required");
  });

  it("should reject registration with an invalid email", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Peter",
      email: "not-an-email",
      password: "StrongPassword123!",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email format");
  });

  it("should reject registration with a weak password", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Peter",
      email: "weak@example.com",
      password: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Password not strong");
  });
});

/* =========================================================
   POST /api/auth/login
========================================================= */

describe("POST /api/auth/login", () => {
  it("should login an existing user successfully", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Peter",
      email: "login@example.com",
      password: "StrongPassword123!",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "LOGIN@EXAMPLE.COM",
      password: "StrongPassword123!",
    });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();

    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: "Peter",
      email: "login@example.com",
      role: "member",
    });

    expect(response.body.message).toBe("Login success");
  });

  it("should reject login when the user does not exist", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "StrongPassword123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("should reject login when the password is incorrect", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Peter",
      email: "wrong-password@example.com",
      password: "StrongPassword123!",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "wrong-password@example.com",
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("should reject login when required fields are missing", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("All fields required");
  });
});

/* =========================================================
   GET /api/auth/me
========================================================= */

describe("GET /api/auth/me", () => {
  it("should return the authenticated user's profile", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Peter",
        email: "me@example.com",
        password: "StrongPassword123!",
      });

    const token = registerResponse.body.token;

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: "Peter",
      email: "me@example.com",
      role: "member",
    });
  });

  it("should reject the request when no token is provided", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Please login or signup");
  });

  it("should reject the request with an invalid token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid or expired token");
  });
});
