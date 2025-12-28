import NotificationModel from "../models/NotificationModel.js";

// Get all notifications controller
const getAllNotifications = async (req, res, next) => {
    try {
        // Get query parameters
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const read = req.query.read || "";

        // Get notifications
        const { items, total, currentPage, lastPage, unreadCount } =
            await NotificationModel.getAllNotifications(page, limit, search, read);

        // Return response
        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: {
                items,
                total,
                currentPage,
                lastPage,
                unreadCount,
            }
        });
    } catch (error) {
        next(error);
    }
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Notification ID is required"
            });
        }

        const success = await NotificationModel.markAsRead(id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: "Notification not found or already read"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        next(error);
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res, next) => {
    try {
        const updatedCount = await NotificationModel.markAllAsRead();

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            data: {
                updatedCount
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getAllNotifications,
    markAsRead,
    markAllAsRead,
};