import express from 'express';
import UserController from '../controllers/UserController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

// Create user
router.post('', authMiddleware, UserController.createUser);

// Get all users
router.get('', authMiddleware, UserController.getAllUsers);

// Get user by id
router.get('/:id', authMiddleware, UserController.getUserById);

// Update user by id
router.patch('/:id', authMiddleware, UserController.updateUserById);

// Delete user by id
router.delete('/:id', authMiddleware, UserController.deleteUserById);

export default router;