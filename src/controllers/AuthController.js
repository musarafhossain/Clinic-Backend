import UserModel from '../models/UserModel.js';
import OtpModel from '../models/OtpModel.js';
import bcrypt from 'bcrypt';
import generateJwtToken from '../utils/generateJwtToken.js';
import { generateOTP } from '../utils/number.js';
import { getCurrentDateTime } from '../utils/time.js';
import { sendEmail } from '../services/emailService.js';
import { otpTemplate } from '../utils/templates.js';

// Login controller
const login = async (req, res, next) => {
    // Get email and password from request body
    const email = req.body.email ?? null;
    const password = req.body.password ?? null;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    try {
        // Get user by email
        const user = await UserModel.getUserByEmail(email);

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const { jwtToken } = await generateJwtToken(user);

        // Remove password from user object
        if (user && user.password) {
            delete user.password;
        }

        // Send response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token: jwtToken,
                user,
            }
        });
    } catch (error) {
        next(error);
    }
};

// send otp controller
const sendOtp = async (req, res, next) => {
    // Get email from request body
    const email = req.body?.email ?? null;

    // Check if email is provided
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    try {
        // Get user by email
        const user = await UserModel.getUserByEmail(email);

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Delete existing otp
        await OtpModel.deleteOtpByUserId(user.id);

        // Generate OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Create OTP
        const createdOtp = await OtpModel.createOtp({
            user_id: user.id,
            otp: hashedOtp,
            created_at: getCurrentDateTime(),
        });

        // Check if otp created
        if (!createdOtp) {
            return res.status(401).json({
                success: false,
                message: 'Failed to create OTP'
            });
        }

        // Set subject and message
        const subject = "Password Reset OTP";
        const message = otpTemplate(otp, user.name ?? "User");

        // Send OTP
        const response = await sendEmail(email, subject, message);

        // Check if otp sent
        if (!response.success) {
            return res.status(401).json({
                success: false,
                message: 'Failed to send OTP',
            });
        }

        // Send response
        res.status(200).json({
            success: response.success,
            message: "OTP sent successfully",
            data: {
                email,
            }
        });
    } catch (error) {
        next(error);
    }
};

// verify otp controller
const verifyOtp = async (req, res, next) => {
    // Get email and otp from request body
    const email = req.body?.email ?? null;
    const otp = req.body?.otp ?? null;

    // Check if email and otp are provided
    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Email and OTP are required'
        });
    }

    try {
        // Get user by email
        const user = await UserModel.getUserByEmail(email);

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or OTP'
            });
        }

        // Get otp by user id
        const otpData = await OtpModel.getOtpByUserId(user.id);

        // Check if otp exists
        if (!otpData) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or OTP'
            });
        }

        // Check if otp is valid
        const isOtpValid = await bcrypt.compare(otp, otpData.otp);
        if (!isOtpValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or OTP'
            });
        }

        // Send response
        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                email,
            }
        });
    } catch (error) {
        next(error);
    }
};

// reset password controller
const resetPassword = async (req, res, next) => {
    // Get email and otp from request body
    const email = req.body?.email ?? null;
    const otp = req.body?.otp ?? null;
    const newPassword = req.body?.password ?? null;
    const newConfirmPassword = req.body?.confirmPassword ?? null;

    // Check if email and otp are provided
    if (!email || !otp || !newPassword || !newConfirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Email, OTP, Password and Confirm Password are required'
        });
    }

    // Check if new password and confirm password are same
    if (newPassword !== newConfirmPassword) {
        return res.status(401).json({
            success: false,
            message: 'New password and confirm password do not match'
        });
    }

    try {
        // Get user by email
        const user = await UserModel.getUserByEmail(email);

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or OTP'
            });
        }

        // Get otp by user id
        const otpData = await OtpModel.getOtpByUserId(user.id);

        // Check if otp exists
        if (!otpData) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or OTP'
            });
        }

        // Check if otp is valid
        const isOtpValid = await bcrypt.compare(otp, otpData.otp);
        if (!isOtpValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or OTP'
            });
        }

        // Delete existing otp
        await OtpModel.deleteOtpByUserId(user.id);

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        const updatedUser = await UserModel.updateUserById(user.id, {
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: hashedPassword,
            updated_at: getCurrentDateTime(),
        });

        // Generate JWT token
        const { jwtToken } = await generateJwtToken(user);

        // Remove password from user object
        if (user && user.password) {
            delete user.password;
        }

        // Send response
        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                token: jwtToken,
                user,
            }
        });
    } catch (error) {
        next(error);
    }
};

// Me controller
const me = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User is not authenticated'
            });
        }

        // Get user from request
        const user = req.user;

        // Remove password from user object
        if (user.password) delete user.password;

        // Send response
        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export default {
    login,
    sendOtp,
    verifyOtp,
    resetPassword,
    me,
}