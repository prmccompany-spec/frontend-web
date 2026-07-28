import express from 'express';
import { listLoginHistory, listMyLoginHistory } from '../controllers/loginHistoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// /me is scoped to the caller's own history regardless of role. The
// unscoped list (admin Login Tracker page) currently only requires being
// logged in, same as every other admin route right now — no role check yet
// (see requireTypes in authMiddleware.js for when that's added).
router.get('/me', listMyLoginHistory);
router.get('/', listLoginHistory);

export default router;
