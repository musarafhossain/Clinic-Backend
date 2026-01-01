import express from 'express';
import AuthController from '../controllers/AuthController.js';
import verifyJwtToken from '../middlewares/verifyJwtToken.js';
import passport from 'passport';

const router = express.Router();

// Login route
router.post('/login', AuthController.login);

// Send OTP route
router.post('/send-otp', AuthController.sendOtp);

// Verify OTP route
router.post('/verify-otp', AuthController.verifyOtp);

// Reset Password route
router.post('/reset-password', AuthController.resetPassword);

// Me route
router.get('/me', verifyJwtToken, passport.authenticate('jwt', { session: false }), AuthController.me);

export default router;