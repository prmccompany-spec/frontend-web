import { hashPassword, comparePassword } from '../utils/passwordUtils.js';
import { generateToken } from '../utils/tokenUtils.js';
import { getUserByEmail, createUser, getUserById } from '../models/userModel.js';

export const loginUser = async (email, password) => {
  const user = await getUserByEmail(email);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    const error = new Error('Invalid password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user.id, user.role);

  return {
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const registerUser = async (userData) => {
  const { name, email, password } = userData;

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    const error = new Error('User already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const userId = await createUser({
    name,
    email,
    hashedPassword,
  });

  const user = await getUserById(userId);
  const token = generateToken(user.id, user.role);

  return {
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};
