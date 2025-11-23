import db from '../config/db.js';

const createUserJwtToken = async (userId, token) => {
    const [result] = await db.execute(
        'INSERT INTO user_jwt_tokens (user_id, token) VALUES (?, ?)',
        [userId, token]
    );
    return { id: result.insertId, userId, token };
}

const updateUserJwtToken = async (userId, token) => {
    await db.execute(
        'UPDATE user_jwt_tokens SET token = ? WHERE user_id = ?',
        [token, userId]
    );
    return { userId, token };
}

const getUserJwtTokenByUserId = async (userId) => {
    const [rows] = await db.execute(
        'SELECT * FROM user_jwt_tokens WHERE user_id = ?',
        [userId]
    );
    return rows[0];
}

const deleteUserJwtTokenByUserId = async (userId) => {
    await db.execute(
        'DELETE FROM user_jwt_tokens WHERE user_id = ?',
        [userId]
    );
    return true;
}

export default {
    createUserJwtToken,
    updateUserJwtToken,
    getUserJwtTokenByUserId,
    deleteUserJwtTokenByUserId,
};