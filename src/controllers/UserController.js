import UserModel from '../models/UserModel.js';
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
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const currentUserId = req.user?.id;

        const { items, total, currentPage, lastPage } = 
            await UserModel.getAllUsers(page, limit, search, currentUserId);

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
            name: req.body.name || null,
            email: req.body.email || null,
            phone: req.body.phone || null,
            password: null,
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

        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            userData.password = hashedPassword;
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