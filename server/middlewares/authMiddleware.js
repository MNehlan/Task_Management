import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Please login or signup' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Fetch live user to get up-to-date role
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).json({ success: false, message: 'Access Denied' });
    }
    next();
  };
};
