import express from 'express';
import AuthController from '../controllers/AuthController.js';
import verifyJwtToken from '../middlewares/verifyJwtToken.js';
import passport from 'passport';

const router = express.Router();

const setCookie = (req, res) => {
    res.cookie("access_token", "jygyujgjhgjhgjhg", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        domain: ".musaraf.org.in",
        maxAge: 60 * 60 * 24 * 5 * 1000, // seconds → ms
    });
    res.status(200).json({
        success: true,
        message: "Cookie set successfully",
    });
};

// Login route
router.post('/login', AuthController.login);
router.all('/set-cookie', setCookie);

// Send OTP route
router.post('/send-otp', AuthController.sendOtp);

// Verify OTP route
router.post('/verify-otp', AuthController.verifyOtp);

// Reset Password route
router.post('/reset-password', AuthController.resetPassword);

// Me route
router.get('/me', verifyJwtToken, passport.authenticate('jwt', { session: false }), AuthController.me);

export default router;