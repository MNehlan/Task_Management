import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new AppError("Please login or signup", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Fetch live user to get up-to-date role
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError("User no longer exists", 401);
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid or expired token", 401);
    }

    throw error;
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError("Access Denied", 403);
    }
    next();
  };
};
