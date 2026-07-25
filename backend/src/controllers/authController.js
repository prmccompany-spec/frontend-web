import { asyncHandler } from '../middleware/errorHandler.js';
import { loginWithPassword, resetOwnPassword } from '../services/authService.js';

export const handleLogin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone number and password are required' });
  }
  const result = await loginWithPassword(phone.trim(), password.trim());
  res.json({ success: true, message: 'Login successful', ...result });
});

export const handleResetPassword = asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({ success: false, message: 'old_password and new_password are required' });
  }
  await resetOwnPassword(req.user.id, old_password.trim(), new_password.trim());
  res.json({ success: true, message: 'Password reset successfully' });
});

export const profile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
