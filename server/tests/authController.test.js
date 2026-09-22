import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import {
  loginUser,
  registerUser,
  getMe,
} from "../controllers/authController.js";

vi.mock("../utils/generateToken.js", () => ({
  default: vi.fn(() => "fake-token"),
}));

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass an error to next when required fields are missing", async () => {
    const req = {
      body: {},
    };

    const res = {};
    const next = vi.fn();

    registerUser(req, res, next);

    // Give the async function time to reject and catchAsync to call next
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "All fields required",
        statusCode: 400,
      }),
    );
  });

  it("should reject non-string input", async () => {
    const req = {
      body: {
        name: 123,
        email: "test@example.com",
        password: "StrongPassword123!",
      },
    };

    const res = {};
    const next = vi.fn();

    registerUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Name, email, and password must be strings",
        statusCode: 400,
      }),
    );
  });

  it("should reject an invalid email", async () => {
    const req = {
      body: {
        name: "Peter",
        email: "not-an-email",
        password: "StrongPassword123!",
      },
    };

    const res = {};
    const next = vi.fn();

    registerUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid email format",
        statusCode: 400,
      }),
    );
  });

  it("should reject an empty name", async () => {
    const req = {
      body: {
        name: "   ",
        email: "test@example.com",
        password: "StrongPassword123!",
      },
    };

    const res = {};
    const next = vi.fn();

    registerUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Name is required",
        statusCode: 400,
      }),
    );
  });

  it("should reject a weak password", async () => {
    const req = {
      body: {
        name: "Peter",
        email: "test@example.com",
        password: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    registerUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Password not strong",
        statusCode: 400,
      }),
    );
  });

  it("should reject registration when email already exists", async () => {
    const req = {
      body: {
        name: "Peter",
        email: "test@example.com",
        password: "StrongPassword123!",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(User, "findOne").mockResolvedValue({
      _id: "123",
      email: "test@example.com",
    });

    registerUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Email already exists",
        statusCode: 409,
      }),
    );

    User.findOne.mockRestore();
  });

  it("should register a user successfully", async () => {
    const req = {
      body: {
        name: "Peter",
        email: "TEST@EXAMPLE.COM",
        password: "StrongPassword123!",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const createdUser = {
      _id: "123",
      name: "Peter",
      email: "test@example.com",
      password: "hashed-password",
      role: "member",
    };

    vi.spyOn(User, "findOne").mockResolvedValue(null);
    vi.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password");
    vi.spyOn(User, "create").mockResolvedValue(createdUser);

    registerUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("StrongPassword123!", 10);

    expect(User.create).toHaveBeenCalledWith({
      name: "Peter",
      email: "test@example.com",
      password: "hashed-password",
    });

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      token: "fake-token",
      user: {
        id: "123",
        name: "Peter",
        email: "test@example.com",
        role: "member",
      },
      message: "User created successfully",
    });

    expect(next).not.toHaveBeenCalled();
    expect(generateToken).toHaveBeenCalledWith(createdUser);

    User.findOne.mockRestore();
    bcrypt.hash.mockRestore();
    User.create.mockRestore();
  });

  it("should pass database errors to next", async () => {
    const req = {
      body: {
        name: "Peter",
        email: "test@example.com",
        password: "StrongPassword123!",
      },
    };

    const res = {};
    const next = vi.fn();

    const databaseError = new Error("Database connection failed");

    vi.spyOn(User, "findOne").mockRejectedValue(databaseError);

    registerUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(databaseError);

    User.findOne.mockRestore();
  });
});

describe("loginUser", () => {
  it("should pass an error to next when required fields are missing", async () => {
    const req = {
      body: {},
    };

    const res = {};
    const next = vi.fn();

    loginUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "All fields required",
        statusCode: 400,
      }),
    );
  });

  it("should reject non-string input", async () => {
    const req = {
      body: {
        email: 123,
        password: "StrongPassword123!",
      },
    };

    const res = {};
    const next = vi.fn();

    loginUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Email and password must be strings",
        statusCode: 400,
      }),
    );
  });

  it("should reject login when the user does not exist", async () => {
    const req = {
      body: {
        email: "unknown@example.com",
        password: "StrongPassword123!",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(User, "findOne").mockResolvedValue(null);

    loginUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findOne).toHaveBeenCalledWith({
      email: "unknown@example.com",
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid credentials",
        statusCode: 401,
      }),
    );

    User.findOne.mockRestore();
  });

  it("should reject login when the password is incorrect", async () => {
    const req = {
      body: {
        email: "test@example.com",
        password: "WrongPassword123!",
      },
    };

    const res = {};
    const next = vi.fn();

    const user = {
      _id: "123",
      name: "Peter",
      email: "test@example.com",
      password: "hashed-password",
      role: "member",
    };

    vi.spyOn(User, "findOne").mockResolvedValue(user);
    vi.spyOn(bcrypt, "compare").mockResolvedValue(false);

    loginUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "WrongPassword123!",
      "hashed-password",
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid credentials",
        statusCode: 401,
      }),
    );

    User.findOne.mockRestore();
    bcrypt.compare.mockRestore();
  });

  it("should login the user successfully", async () => {
    const req = {
      body: {
        email: "TEST@EXAMPLE.COM",
        password: "CorrectPassword123!",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const user = {
      _id: "123",
      name: "Peter",
      email: "test@example.com",
      password: "hashed-password",
      role: "member",
    };

    vi.spyOn(User, "findOne").mockResolvedValue(user);
    vi.spyOn(bcrypt, "compare").mockResolvedValue(true);

    loginUser(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "CorrectPassword123!",
      "hashed-password",
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      token: "fake-token",
      user: {
        id: "123",
        name: "Peter",
        email: "test@example.com",
        role: "member",
      },
      message: "Login success",
    });

    expect(next).not.toHaveBeenCalled();

    User.findOne.mockRestore();
    bcrypt.compare.mockRestore();
  });
});

describe("getMe", () => {
  it("should pass an error to next when user does not exist", async () => {
    const req = {
      user: {
        id: "123",
      },
    };

    const res = {};
    const next = vi.fn();

    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    getMe(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findById).toHaveBeenCalledWith("123");

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      }),
    );

    User.findById.mockRestore();
  });

  it("should return the current user successfully", async () => {
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

    const user = {
      _id: "123",
      name: "Peter",
      email: "test@example.com",
      role: "member",
    };

    const select = vi.fn().mockResolvedValue(user);

    vi.spyOn(User, "findById").mockReturnValue({
      select,
    });

    getMe(req, res, next);

    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findById).toHaveBeenCalledWith("123");
    expect(select).toHaveBeenCalledWith("-password");

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id: "123",
        name: "Peter",
        email: "test@example.com",
        role: "member",
      },
    });

    expect(next).not.toHaveBeenCalled();

    User.findById.mockRestore();
  });
});
