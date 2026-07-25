import express from 'express';
import { scan, listAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/scan', scan);
router.get('/', listAttendance);

export default router;
