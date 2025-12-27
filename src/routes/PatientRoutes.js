import express from 'express';
import PatientController from '../controllers/PatientController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

// Create patient
router.post('', authMiddleware, PatientController.createPatient);

// Get all patients
router.get('', authMiddleware, PatientController.getAllPatients);

// Get patient by id
router.get('/:id', authMiddleware, PatientController.getPatientById);

// Update patient by id
router.patch('/:id', authMiddleware, PatientController.updatePatientById);

// Delete patient by id
router.delete('/:id', authMiddleware, PatientController.deletePatientById);

export default router;