import express from 'express';
import AttendanceController from '../controllers/AttendanceController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

router.get('', authMiddleware, AttendanceController.getAllAttendance);
router.post('/mark-attendance', authMiddleware, AttendanceController.markAttendance);
router.get('/:patientId', authMiddleware, AttendanceController.getAttendanceByPatientId);


export default router;
