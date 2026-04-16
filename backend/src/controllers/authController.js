import { asyncHandler } from '../middleware/errorHandler.js';
import { loginUser, registerUser } from '../services/authService.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const result = await loginUser(email, password);

  res.json({
    success: true,
    message: 'Login successful',
    ...result,
  });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  const result = await registerUser({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    ...result,
  });
});

export const profile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});
