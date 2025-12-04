import express from 'express';
import DiseaseController from '../controllers/DiseaseController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

router.post('', authMiddleware, DiseaseController.createDisease);
router.get('', authMiddleware, DiseaseController.getAllDiseases);
router.get('/:id', authMiddleware, DiseaseController.getDiseaseById);
router.patch('/:id', authMiddleware, DiseaseController.updateDiseaseById);
router.delete('/:id', authMiddleware, DiseaseController.deleteDiseaseById);

export default router;