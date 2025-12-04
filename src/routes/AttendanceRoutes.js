import express from 'express';
import AttendanceController from '../controllers/AttendanceController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

router.post('/single', authMiddleware, AttendanceController.markSingleAttendance);
router.post('/bulk', authMiddleware, AttendanceController.bulkMarkAttendance);
router.get('', authMiddleware, AttendanceController.getAttendanceByDate);
router.get('/patient-attendances', authMiddleware, AttendanceController.getAttendanceByPatientId);
router.get('/patients', authMiddleware, AttendanceController.getPatientsWithAttendance);

export default router;
