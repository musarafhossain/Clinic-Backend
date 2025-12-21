import UserModel from '../models/UserModel.js';
import bcrypt from 'bcrypt';
import generateJwtToken from '../utils/generateJwtToken.js';

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
            token: jwtToken,
            user,
        });
    } catch (error) {
        next(error);
    }
};

// Me controller
const me = async (req, res) => {
    // Get user from request
    const user = req.user;

    // Remove password from user object
    if (user.password) delete user.password;

    // Send response
    res.status(200).json({
        success: true,
        user,
    });
};

export default {
    login,
    me,
}