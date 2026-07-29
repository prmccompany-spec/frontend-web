import express from 'express';
import { scan, listAttendance } from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/scan', scan);
router.get('/', listAttendance);

export default router;
