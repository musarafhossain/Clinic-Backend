import express from 'express';
import PatientController from '../controllers/PatientController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

router.get('/payment-history', authMiddleware, PatientController.getPaymentHistoryByPatientId);
router.delete('/payment-history/:id', authMiddleware, PatientController.deletePaymentHistoryById);
router.post('', authMiddleware, PatientController.createPatient);
router.get('', authMiddleware, PatientController.getAllPatients);
router.get('/:id', authMiddleware, PatientController.getPatientById);
router.patch('/:id', authMiddleware, PatientController.updatePatientById);
router.delete('/:id', authMiddleware, PatientController.deletePatientById);
router.post('/add-payment/:id', authMiddleware, PatientController.addPatientPayment);

export default router;