import rateLimit from "express-rate-limit";

export const createLoginLimiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,

    max,

    message: {
      success: false,
      message: "Too many login attempts. Please try again later.",
    },

    standardHeaders: true,
    legacyHeaders: false,
  });

export const loginLimiter = createLoginLimiter(
  process.env.NODE_ENV === "test" ? 1000 : 5,
);
