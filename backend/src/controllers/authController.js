import { asyncHandler } from '../middleware/errorHandler.js';
import { identifyLoginAccount, loginWithPassword, refreshSession, logout, resetOwnPassword } from '../services/authService.js';

export const identifyLoginType = asyncHandler(async (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  if (phone.length < 10) {
    return res.status(400).json({ success: false, message: 'A valid phone number is required' });
  }
  res.json({ success: true, ...await identifyLoginAccount(phone) });
});

export const handleLogin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone number and password are required' });
  }
  const result = await loginWithPassword(phone.trim(), password.trim(), {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  res.json({ success: true, message: 'Login successful', ...result });
});

export const handleRefresh = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  const result = await refreshSession(refresh_token, req.headers['user-agent']);
  res.json({ success: true, ...result });
});

export const handleLogout = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  await logout(refresh_token);
  res.json({ success: true, message: 'Logged out' });
});

export const handleResetPassword = asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({ success: false, message: 'old_password and new_password are required' });
  }
  await resetOwnPassword(req.user, old_password.trim(), new_password.trim());
  res.json({ success: true, message: 'Password reset successfully' });
});

export const profile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
