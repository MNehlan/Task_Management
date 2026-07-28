import bcrypt from 'bcrypt';
import validator from 'validator';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const registerUser = catchAsync(async (req, res) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('All fields required', 400);
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('Name, email, and password must be strings', 400);
  }

  name = name.trim();
  email = email.toLowerCase().trim();

  if (!validator.isEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }

  if (validator.isEmpty(name)) {
    throw new AppError('Name is required', 400);
  }

  if (!validator.isStrongPassword(password)) {
    throw new AppError('Password not strong', 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({
    success: true,
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: 'User created successfully',
  });
});

const loginUser = catchAsync(async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('All fields required', 400);
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('Email and password must be strings', 400);
  }

  email = email.toLowerCase().trim();

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  res.status(200).json({
    success: true,
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    message: 'Login success',
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export { registerUser, loginUser, getMe };
