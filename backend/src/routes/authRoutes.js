import express from 'express';
import { handleLogin, handleRefresh, handleLogout, handleResetPassword, profile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// /refresh and /logout are intentionally not behind authMiddleware — the
// refresh token itself (not the, possibly expired, access token) is the
// credential for both.
router.post('/login', handleLogin);
router.post('/refresh', handleRefresh);
router.post('/logout', handleLogout);
router.post('/reset-password', authMiddleware, handleResetPassword);
router.get('/profile', authMiddleware, profile);

export default router;
