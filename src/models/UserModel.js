import db from '../config/db.js';

const createUser = async (userData) => {
    const { name, email, password, phone } = userData;
    const [result] = await db.execute(
        'INSERT INTO users (name, email, password, phone, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [name, email, password, phone]
    );
    return { id: result.insertId, ...userData };
}

const getAllUsers = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
        'SELECT id, name, email, phone, created_at, updated_at FROM users LIMIT ? OFFSET ?',
        [limit, offset]
    );
    const [[{ total }]] = await db.execute(
        'SELECT COUNT(*) as total FROM users'
    );

    return {
        users: rows,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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