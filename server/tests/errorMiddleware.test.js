import { describe, it, expect, vi } from "vitest";
import errorMiddleware from "../middlewares/errorMiddleware.js";
import AppError from "../utils/AppError.js";

describe("errorMiddleware", () => {
  it("should send the error status code and message", () => {
    const err = new AppError("Something went wrong", 400);

    const req = {};
    const next = vi.fn();

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Something went wrong",
    });
  });

  it("should use 500 when no status code is provided", () => {
    const err = new Error("Unexpected error");

    const req = {};
    const next = vi.fn();

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unexpected error",
    });
  });
});
