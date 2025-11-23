import express from 'express';
import { AuthController } from '../controllers/index.js';

const router = express.Router();

router.post('/login', AuthController.login);

export default router;