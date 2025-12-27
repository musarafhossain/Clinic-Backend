import UserModel from '../models/UserModel.js';
import bcrypt from 'bcrypt';
import { getCurrentDateTime } from '../utils/time.js';

// Create user controller
const createUser = async (req, res, next) => {
    try {
        // Prepare user data
        const userData = {
            name: req.body.name || null,
            email: req.body.email || null,
            password: req.body.password || null,
            phone: req.body.phone || null,
            created_at: getCurrentDateTime(),
            updated_at: getCurrentDateTime(),
        };

        // Validate user data
        if (!userData?.email || !userData?.password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: email, password"
            });
        }

        // Check if user already exists
        const existingUser = await UserModel.getUserByEmail(userData.email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;

        // Create user
        const newUser = await UserModel.createUser(userData);

        // Remove password from response
        if (newUser && newUser.password) {
            delete newUser.password;
        }

        // Return response
        res.status(201).json({
            success: true,
            data: newUser,
            message: 'User created successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get all users controller
const getAllUsers = async (req, res, next) => {
    try {
        // Get query parameters
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        // Get current user id
        const currentUserId = req.user?.id;

        // Get users
        const { items, total, currentPage, lastPage } =
            await UserModel.getAllUsers(page, limit, search, currentUserId);

        // Return response
        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                items,
                total,
                currentPage,
                lastPage,
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get user by id controller
const getUserById = async (req, res, next) => {
    try {
        // Get user id
        const userId = req.params.id;

        // Get user
        const user = await UserModel.getUserById(userId);

        // Check if user exists 
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove password from response
        if (user && user.password) {
            delete user.password;
        }

        // Return response
        res.status(200).json({
            success: true,
            data: user,
            message: 'User retrieved successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Update user by id controller
const updateUserById = async (req, res, next) => {
    try {
        // Get user id
        const userId = req.params.id;

        // Check if user id is provided
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Get current user
        const currUser = await UserModel.getUserById(userId);

        // Check if user exists
        if (!currUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prepare user data
        let userData = {
            ...currUser,
            name: req.body.name || null,
            email: req.body.email || null,
            phone: req.body.phone || null,
            password: null,
            updated_at: getCurrentDateTime(),
        };

        // Check if email is provided
        if (!userData.email) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: email"
            });
        }

        // Check if email is already taken
        const userExist = await UserModel.checkUserExist(userId, userData.email);
        if (userExist) {
            return res.status(409).json({
                success: false,
                message: "Email is already taken"
            });
        }

        // Check if password is provided
        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            userData.password = hashedPassword;
        }

        // Update user
        const updatedUser = await UserModel.updateUserById(userId, userData);

        // Remove password from response
        if (updatedUser && updatedUser.password) {
            delete updatedUser.password;
        }

        // Return response
        return res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Delete user by id controller
const deleteUserById = async (req, res, next) => {
    try {
        // Get id from params
        const userId = req.params.id;

        // Get user by id
        const user = await UserModel.getUserById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete user
        await UserModel.deleteUserById(userId);

        // Remove password from response
        if (user && user.password) {
            delete user.password;
        }

        // Return response
        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

export default {
    createUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById
};