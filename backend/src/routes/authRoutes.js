import express from 'express';
import { handleLogin, handleResetPassword, profile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', handleLogin);
router.post('/reset-password', authMiddleware, handleResetPassword);
router.get('/profile', authMiddleware, profile);

export default router;
