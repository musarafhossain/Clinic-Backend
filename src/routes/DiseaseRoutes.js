import express from 'express';
import DiseaseController from '../controllers/DiseaseController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

// Create disease
router.post('', authMiddleware, DiseaseController.createDisease);

// Get all diseases
router.get('', authMiddleware, DiseaseController.getAllDiseases);

// Get disease by id
router.get('/:id', authMiddleware, DiseaseController.getDiseaseById);

// Update disease by id
router.patch('/:id', authMiddleware, DiseaseController.updateDiseaseById);

// Delete disease by id
router.delete('/:id', authMiddleware, DiseaseController.deleteDiseaseById);

export default router;