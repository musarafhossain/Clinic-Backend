import express from 'express';
import StatController from '../controllers/StatController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

router.get('/home', authMiddleware, StatController.getHomeStats);

export default router;