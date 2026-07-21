import { asyncHandler } from '../middleware/errorHandler.js';
import { loginWithPhone, requestLoginOtp, verifyLoginOtp } from '../services/authService.js';

export const handleLogin = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }
  const result = await loginWithPhone(phone.trim());
  res.json({ success: true, message: 'Login successful', ...result });
});

export const handleSendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }
  await requestLoginOtp(phone.trim());
  res.json({ success: true, message: 'OTP sent' });
});

export const handleVerifyOtp = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP code are required' });
  }
  const result = await verifyLoginOtp(phone.trim(), code.trim());
  res.json({ success: true, message: 'Login successful', ...result });
});

export const profile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
