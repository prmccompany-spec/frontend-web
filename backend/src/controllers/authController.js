import { asyncHandler } from '../middleware/errorHandler.js';
import { requestOtp, verifyOtp } from '../services/authService.js';

export const handleRequestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }
  const result = await requestOtp(phone.trim());
  res.json({ success: true, ...result });
});

export const handleVerifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
  }
  const result = await verifyOtp(phone.trim(), otp.trim());
  res.json({ success: true, message: 'Login successful', ...result });
});

export const profile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
