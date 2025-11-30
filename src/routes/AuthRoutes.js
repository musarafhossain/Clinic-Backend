import express from 'express';
import { AuthController } from '../controllers/index.js';
import verifyJwtToken from '../middlewares/verifyJwtToken.js';
import passport from 'passport';

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/me', verifyJwtToken, passport.authenticate('jwt', { session: false }), AuthController.me);

export default router;