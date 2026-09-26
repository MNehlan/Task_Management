import { describe, it, expect, vi } from "vitest";
import { createLoginLimiter } from "../../../middlewares/rateLimitMiddleware.js";

describe("loginLimiter", () => {
  it("should allow requests within the limit", async () => {
    const loginLimiter = createLoginLimiter(5);

    const req = {
      ip: "127.0.0.1",
      app: {
        get: vi.fn().mockReturnValue(false),
      },
      headers: {},
    };

    const res = {
      setHeader: vi.fn(),
      getHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn(),
    };

    const next = vi.fn();

    await loginLimiter(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("should reject the request after the limit is exceeded", async () => {
    const loginLimiter = createLoginLimiter(5);

    const req = {
      ip: "127.0.0.2",
      app: {
        get: vi.fn().mockReturnValue(false),
      },
      headers: {},
    };

    const res = {
      setHeader: vi.fn(),
      getHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      end: vi.fn(),
    };

    const next = vi.fn();

    for (let i = 0; i < 6; i++) {
      await loginLimiter(req, res, next);
    }

    expect(next).toHaveBeenCalledTimes(5);

    expect(res.status).toHaveBeenCalledWith(429);

    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Too many login attempts. Please try again later.",
    });
  });
});