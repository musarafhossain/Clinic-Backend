import db from '../config/db.js';
import { getCurrentDateTime } from '../utils/time.js';

// Create user
/*
    @param {Object} userData - User data
    @param {string} userData.name - User name
    @param {string} userData.email - User email
    @param {string} userData.password - User password
    @param {string} userData.phone - User phone
    @returns {Promise<Object>} - User data
*/
const createUser = async (userData) => {
    // Destructure user data
    const { name, email, password, phone } = userData;

    // Insert user
    const [result] = await db.execute(
        'INSERT INTO users (name, email, password, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password, phone, getCurrentDateTime(), getCurrentDateTime()]
    );

    // Return user data
    return { id: result.insertId, ...userData };
}

// Get all users
/*
    @param {Object} params - Parameters
    @param {number} params.page - Page number
    @param {number} params.limit - Limit number
    @param {string} params.search - Search string
    @param {number} params.excludeUserId - Exclude user id
    @returns {Promise<Object>} - User data
*/
const getAllUsers = async (page = 1, limit = 10, search = "", excludeUserId = null) => {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Create search pattern
    const searchPattern = `%${search}%`;

    // Create params
    const params = [searchPattern, searchPattern];
    let whereClause = `(name LIKE ? OR email LIKE ?)`;

    // Exclude user id if provided
    if (excludeUserId) {
        whereClause += ` AND id != ?`;
        params.push(excludeUserId);
    }

    // Add limit and offset
    params.push(limit, offset);

    // Get users
    const [rows] = await db.execute(
        `
        SELECT id, name, email, phone, created_at, updated_at 
        FROM users
        WHERE ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        `,
        params
    );

    // Get total count
    const countParams = [searchPattern, searchPattern];

    // Create count where clause
    let countWhere = `(name LIKE ? OR email LIKE ?)`;

    // Exclude user id if provided
    if (excludeUserId) {
        countWhere += ` AND id != ?`;
        countParams.push(excludeUserId);
    }

    // Get total count
    const [[{ total }]] = await db.execute(
        `
        SELECT COUNT(*) as total 
        FROM users 
        WHERE ${countWhere}
        `,
        countParams
    );

    // Return users
    return {
        items: rows,
        currentPage: page,
        limit: limit,
        total: total,
        lastPage: Math.ceil(total / limit), // Calculate last page
    };
};

// Get user by id
/*
    @param {number} userId - User id
    @returns {Promise<Object>} - User data
*/
const getUserById = async (userId) => {
    // Get user by id
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);

    // Return user
    return rows[0];
}

// Get user by email
/*
    @param {string} email - User email
    @returns {Promise<Object>} - User data
*/
const getUserByEmail = async (email) => {
    // Get user by email
    const [rows] = await db.execute(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
    );

    // Return user
    return rows[0] || null;
};

// Update user by id
/*
    @param {number} userId - User id
    @param {Object} userData - User data
    @param {string} userData.name - User name
    @param {string} userData.email - User email
    @param {string} userData.password - User password
    @param {string} userData.phone - User phone
    @returns {Promise<Object>} - User data
*/
const updateUserById = async (userId, userData) => {
    // Destructure user data
    const { name, email, phone, password } = userData;

    // Create update fields and values
    let updateFields = ["name = ?", "email = ?", "phone = ?"];
    let updateValues = [name, email, phone];

    // Add password if provided
    if (password) {
        updateFields.push("password = ?");
        updateValues.push(password);
    }

    // Add user id value
    updateValues.push(userId);

    // Add updated at value
    updateValues.push(getCurrentDateTime());

    // Update user
    await db.execute(
        `UPDATE users SET ${updateFields.join(", ")}, updated_at = ? WHERE id = ?`,
        updateValues
    );

    // Return updated user
    return {
        id: userId,
        ...userData,
    };
};

// Check user exist
/*
    @param {number} userId - User id
    @param {string} email - User email
    @returns {Promise<boolean>} - User data
*/
const checkUserExist = async (userId, email) => {
    // Check user exist exclude given user
    const [existingEmail] = await db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId]
    );

    // Return existing or not
    return existingEmail.length > 0;
}

// Delete user by id
/*
    @param {number} userId - User id
    @returns {Promise<boolean>} - User data
*/
const deleteUserById = async (userId) => {
    // Delete user
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);

    // Return true
    return true;
}

export default {
    createUser,
    getAllUsers,
    getUserById,
    getUserByEmail,
    checkUserExist,
    updateUserById,
    deleteUserById,
};