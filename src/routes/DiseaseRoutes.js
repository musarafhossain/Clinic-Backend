import express from 'express';
import DiseaseController from '../controllers/DiseaseController.js';

const router = express.Router();

router.post('', DiseaseController.createDisease);
router.get('', DiseaseController.getAllDiseases);
router.get('/:id', DiseaseController.getDiseaseById);
router.patch('/:id', DiseaseController.updateDiseaseById);
router.delete('/:id', DiseaseController.deleteDiseaseById);

export default router;