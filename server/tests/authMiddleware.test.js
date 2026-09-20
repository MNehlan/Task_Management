import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

process.env.SECRET_KEY = "test-secret-key";
describe("verifyToken", () => {
  it("should return 401 when no token is provided", async () => {
    const req = {
      headers: {},
    };

    const res = {};

    const next = vi.fn();

    await expect(verifyToken(req, res, next)).rejects.toMatchObject({
      message: "Please login or signup",
      statusCode: 401,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an invalid token", async () => {
    const req = {
      headers: {
        authorization: "Bearer waste",
      },
    };

    const res = {};

    const next = vi.fn();

    await expect(verifyToken(req, res, next)).rejects.toMatchObject({
      message: "Invalid or expired token",
      statusCode: 401,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an expired token", async () => {
    const req = {
      headers: {
        authorization: `Bearer ${jwt.sign(
          { id: "123", role: "manager" },
          process.env.SECRET_KEY,
          { expiresIn: "-1s" },
        )}`,
      },
    };

    const res = {};
    const next = vi.fn();

    await expect(verifyToken(req, res, next)).rejects.toMatchObject({
      message: "Invalid or expired token",
      statusCode: 401,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should authenticate a valid token and attach the user to req", async () => {
    const user = {
      _id: "123",
      role: "manager",
    };

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "1d" },
    );

    vi.spyOn(User, "findById").mockResolvedValue(user);

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res = {};
    const next = vi.fn();

    await verifyToken(req, res, next);

    expect(User.findById).toHaveBeenCalledWith("123");

    expect(req.user).toEqual({
      id: "123",
      role: "manager",
    });

    expect(next).toHaveBeenCalledOnce();

    User.findById.mockRestore();
  });

  it("should reject the token when the user no longer exists", async () => {
    const token = jwt.sign(
      { id: "123", role: "manager" },
      process.env.SECRET_KEY,
      { expiresIn: "1d" },
    );

    vi.spyOn(User, "findById").mockResolvedValue(null);

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res = {};
    const next = vi.fn();

    await expect(verifyToken(req, res, next)).rejects.toMatchObject({
      message: "User no longer exists",
      statusCode: 401,
    });

    expect(User.findById).toHaveBeenCalledWith("123");
    expect(next).not.toHaveBeenCalled();

    User.findById.mockRestore();
  });

  it("should preserve unexpected database errors", async () => {
    const token = jwt.sign(
      { id: "123", role: "manager" },
      process.env.SECRET_KEY,
      { expiresIn: "1d" },
    );

    const databaseError = new Error("Database connection failed");

    vi.spyOn(User, "findById").mockRejectedValue(databaseError);

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res = {};
    const next = vi.fn();

    await expect(verifyToken(req, res, next)).rejects.toBe(databaseError);

    expect(next).not.toHaveBeenCalled();

    User.findById.mockRestore();
  });
});

describe("authorizeRoles", () => {
  it("should allow a user with an authorized role", () => {
    const req = {
      user: {
        id: "123",
        role: "manager",
      },
    };

    const res = {};
    const next = vi.fn();

    const middleware = authorizeRoles("manager", "admin");

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("should reject a user with an unauthorized role", () => {
    const req = {
      user: {
        id: "123",
        role: "member",
      },
    };

    const res = {};
    const next = vi.fn();

    const middleware = authorizeRoles("manager", "admin");

    expect(() => {
      middleware(req, res, next);
    }).toThrow(
      expect.objectContaining({
        message: "Access Denied",
        statusCode: 403,
      }),
    );

    expect(next).not.toHaveBeenCalled();
  });
});
