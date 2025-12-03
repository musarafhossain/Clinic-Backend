import express from 'express';
import PatientController from '../controllers/PatientController.js';

const router = express.Router();

router.post('', PatientController.createPatient);
router.get('', PatientController.getAllPatients);
router.get('/:id', PatientController.getPatientById);
router.patch('/:id', PatientController.updatePatientById);
router.delete('/:id', PatientController.deletePatientById);

export default router;