import express from 'express';
import AttendanceController from '../controllers/AttendanceController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

router.post('/single', authMiddleware, AttendanceController.markSingleAttendance);
router.get('/attendance-history', authMiddleware, AttendanceController.getAttendanceHistoryByPatientId);
router.get('/patients', authMiddleware, AttendanceController.getPatientsWithAttendance);

export default router;
