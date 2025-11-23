import { UserModel } from '../models/index.js';
import bcrypt from 'bcrypt';

const createUser = async (req, res, next) => {
    try {
        const userData = {
            name: req.body.name || null,
            email: req.body.email || null,
            password: req.body.password || null,
            phone: req.body.phone || null,
        };
        if (!userData?.email || !userData?.password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: email, password"
            });
        }

        const existingUser = await UserModel.getUserByEmail(userData.email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;

        const newUser = await UserModel.createUser(userData);

        if (newUser && newUser.password) {
            delete newUser.password;
        }

        res.status(201).json({
            success: true,
            data: newUser,
            message: 'User created successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { users, total, page, limit } = await UserModel.getAllUsers();
        res.status(200).json({
            success: true,
            data: users,
            page: page,
            limit: limit,
            total: total,
            message: 'Users retrieved successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await UserModel.getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user && user.password) {
            delete user.password;
        }

        res.status(200).json({
            success: true,
            data: user,
            message: 'User retrieved successfully'
        });
    } catch (error) {
        next(error);
    }
};

const updateUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const currUser = await UserModel.getUserById(userId);
        if (!currUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let userData = {
            ...currUser,
            name: req.body.name || currUser.name || null,
            email: req.body.email || currUser.email || null,
            phone: req.body.phone || currUser.phone || null,
        };

        if (!userData.email) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: email"
            });
        }

        const userExist = await UserModel.checkUserExist(userId, userData.email);
        if (userExist) {
            return res.status(409).json({
                success: false,
                message: "Email is already taken"
            });
        }

        const updatedUser = await UserModel.updateUserById(userId, userData);

        if (updatedUser && updatedUser.password) {
            delete updatedUser.password;
        }

        return res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

const deleteUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await UserModel.getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await UserModel.deleteUserById(userId);

        if (user && user.password) {
            delete user.password;
        }

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