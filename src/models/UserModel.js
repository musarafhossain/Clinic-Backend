import db from '../config/db.js';

// Create user
/*
    @param {Object} userData - User data
    @param {string} userData.name - User name
    @param {string} userData.email - User email
    @param {string} userData.password - User password
    @param {string} userData.phone - User phone
    @param {string} userData.created_at - User created at
    @param {string} userData.updated_at - User updated at
    @returns {Promise<Object>} - User data
*/
const createUser = async (userData) => {
    // Destructure user data
    const { name, email, password, phone, created_at, updated_at } = userData;

    // Insert user
    const [result] = await db.execute(
        'INSERT INTO users (name, email, password, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password, phone, created_at, updated_at]
    );

    // Get created user
    const createdUser = await getUserById(result.insertId);

    // Return user data
    return createdUser;
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
const getAllUsers = async (
    page = 1,
    limit = 10,
    search = "",
    excludeUserId = null
) => {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Search pattern
    const searchPattern = `%${search}%`;

    // Params for main query
    const params = [searchPattern, searchPattern];

    // WHERE clause (use table alias!)
    let whereClause = `(u.name LIKE ? OR u.email LIKE ?)`;

    // Exclude user id if provided
    if (excludeUserId) {
        whereClause += ` AND u.id != ?`;
        params.push(excludeUserId);
    }

    // Pagination params
    params.push(limit, offset);

    // Fetch users
    const [rows] = await db.execute(
        `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.created_at,
            u.updated_at,
            t.created_at AS lastLogin
        FROM users u
        LEFT JOIN user_jwt_tokens t 
            ON t.user_id = u.id
        WHERE ${whereClause}
        ORDER BY u.id DESC
        LIMIT ? OFFSET ?
        `,
        params
    );

    // ---------- COUNT QUERY ----------
    const countParams = [searchPattern, searchPattern];
    let countWhere = `(u.name LIKE ? OR u.email LIKE ?)`;

    if (excludeUserId) {
        countWhere += ` AND u.id != ?`;
        countParams.push(excludeUserId);
    }

    const [[{ total }]] = await db.execute(
        `
        SELECT COUNT(*) AS total
        FROM users u
        WHERE ${countWhere}
        `,
        countParams
    );

    return {
        items: rows,
        currentPage: page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
    };
};

// Get user by id
/*
    @param {number} userId - User id
    @returns {Promise<Object>} - User data
*/
const getUserById = async (userId) => {
    // Get user by id
    const [rows] = await db.execute(
        `
        SELECT 
            u.*,
            t.created_at AS lastLogin
        FROM users u
        LEFT JOIN user_jwt_tokens t 
            ON t.user_id = u.id
        WHERE u.id = ?
        LIMIT 1
        `,
        [userId]
    );

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
        `
        SELECT 
            u.*,
            t.created_at AS lastLogin
        FROM users u
        LEFT JOIN user_jwt_tokens t 
            ON t.user_id = u.id
        WHERE u.email = ?
        LIMIT 1
        `,
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
    @param {string} userData.updated_at - User updated at
    @returns {Promise<Object>} - User data
*/
const updateUserById = async (userId, userData) => {
    // Destructure user data
    const { name, email, phone, password, updated_at } = userData;

    // Create update fields and values
    let updateFields = ["name = ?", "email = ?", "phone = ?"];
    let updateValues = [name, email, phone];

    // Add password if provided
    if (password) {
        updateFields.push("password = ?");
        updateValues.push(password);
    }

    // Add updated at value
    updateValues.push(updated_at);

    // Add user id value
    updateValues.push(userId);

    // Update user
    await db.execute(
        `UPDATE users SET ${updateFields.join(", ")}, updated_at = ? WHERE id = ?`,
        updateValues
    );

    // Get updated user
    const updatedUser = await getUserById(userId);

    // Return updated user
    return updatedUser;
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