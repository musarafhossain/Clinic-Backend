import db from '../config/db.js';

const createUser = async (userData) => {
    const { name, email, password, phone } = userData;
    const [result] = await db.execute(
        'INSERT INTO users (name, email, password, phone, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [name, email, password, phone]
    );
    return { id: result.insertId, ...userData };
}

const getAllUsers = async (page = 1, limit = 10, search = "", excludeUserId = null) => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const params = [searchPattern, searchPattern];
    let whereClause = `(name LIKE ? OR email LIKE ?)`;

    if (excludeUserId) {
        whereClause += ` AND id != ?`;
        params.push(excludeUserId);
    }

    params.push(limit, offset);

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

    const countParams = [searchPattern, searchPattern];
    let countWhere = `(name LIKE ? OR email LIKE ?)`;
    if (excludeUserId) {
        countWhere += ` AND id != ?`;
        countParams.push(excludeUserId);
    }

    const [[{ total }]] = await db.execute(
        `
        SELECT COUNT(*) as total 
        FROM users 
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

const getUserById = async (userId) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
    return rows[0];
}

const getUserByEmail = async (email) => {
    const [rows] = await db.execute(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
    );
    return rows[0] || null;
};

const updateUserById = async (userId, userData) => {
    const { name, email, phone } = userData;

    await db.execute(
        "UPDATE users SET name = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?",
        [name, email, phone, userId]
    );

    return { id: userId, ...userData };
};

const checkUserExist = async (userId, email) => {
    const [existingEmail] = await db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId]
    );

    return existingEmail.length > 0;
}

const deleteUserById = async (userId) => {
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
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