import express from 'express';
import UserController from '../controllers/UserController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

router.post('', authMiddleware, UserController.createUser);
router.get('', authMiddleware, UserController.getAllUsers);
router.get('/:id', authMiddleware, UserController.getUserById);
router.patch('/:id', authMiddleware, UserController.updateUserById);
router.delete('/:id', authMiddleware, UserController.deleteUserById);

export default router;