import express from 'express';
import NotificationController from '../controllers/NotificationController.js';
import authMiddleware from '../middlewares/verifyJwtToken.js';

const router = express.Router();

// Get all notifications
router.get('', authMiddleware, NotificationController.getAllNotifications);

// Mark notification as read
router.patch('/:id/read', authMiddleware, NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', authMiddleware, NotificationController.markAllAsRead);

export default router;