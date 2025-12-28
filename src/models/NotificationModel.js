import db from '../config/db.js';

const createNotification = async (conn, data) => {
    const { patient_id, patient_name, total_attendance_count, total_bill, message, created_at } = data;

    const [result] = await conn.execute(
        `INSERT INTO notifications 
            (patient_id, patient_name, total_attendance_count, total_bill, message, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        [patient_id, patient_name, total_attendance_count, total_bill, message, created_at]
    );
    return result;
};

const getNotificationByPatientId = async (conn, patient_id) => {
    const [rows] = await conn.execute(
        `SELECT * FROM notifications WHERE patient_id = ?`,
        [patient_id]
    );
    return rows;
};

const updateNotification = async (conn, data) => {
    const { patient_id, patient_name, total_attendance_count, total_bill, message, created_at } = data;

    const [result] = await conn.execute(
        `UPDATE notifications 
            SET 
            patient_name = ?,
            total_attendance_count = ?,
            total_bill = ?,
            message = ?,
            is_read = 0,
            created_at = ?
            WHERE patient_id = ?`,
        [patient_name, total_attendance_count, total_bill, message, created_at, patient_id]
    );

    return result;
};

const getAllNotifications = async (page = 1, limit = 10, search = "", read = "") => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    // Base params for search
    const params = [searchPattern, searchPattern];
    let whereClause = `(patient_name LIKE ? OR message LIKE ?)`;

    // Filter by read status if provided
    if (read === "true") {
        whereClause += ` AND is_read = 1`;
    } else if (read === "false") {
        whereClause += ` AND is_read = 0`;
    }

    // Add pagination params
    params.push(limit, offset);

    const [rows] = await db.execute(
        `SELECT 
            n.id,
            n.patient_id,
            n.patient_name,
            n.total_attendance_count,
            n.total_bill,
            n.message,
            n.is_read,
            n.created_at,
            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payment_history
                WHERE patient_id = n.patient_id
            ) AS amount_paid
         FROM notifications n
         WHERE ${whereClause}
         ORDER BY n.created_at DESC
         LIMIT ? OFFSET ?`,
        params
    );

    // Count query
    const countParams = [searchPattern, searchPattern];
    let countWhere = `(patient_name LIKE ? OR message LIKE ?)`;

    if (read === "true") {
        countWhere += ` AND is_read = 1`;
    } else if (read === "false") {
        countWhere += ` AND is_read = 0`;
    }

    const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM notifications 
         WHERE ${countWhere}`,
        countParams
    );

    const total = countResult[0].total;

    // Get total unread notifications
    const [unreadResult] = await db.execute(
        `SELECT COUNT(*) as total FROM notifications WHERE is_read = 0`
    );
    const unreadCount = unreadResult[0].total;

    return {
        items: rows,
        currentPage: page,
        limit,
        total,
        unreadCount,
        lastPage: Math.ceil(total / limit),
    };
};

const markAsRead = async (id) => {
    const [result] = await db.execute(
        `UPDATE notifications SET is_read = 1 WHERE id = ?`,
        [id]
    );
    return result.affectedRows > 0;
};

const markAllAsRead = async () => {
    const [result] = await db.execute(
        `UPDATE notifications SET is_read = 1 WHERE is_read = 0`
    );
    return result.affectedRows;
};

export default {
    createNotification,
    getNotificationByPatientId,
    updateNotification,
    getAllNotifications,
    markAsRead,
    markAllAsRead,
};