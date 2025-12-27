import db from '../config/db.js';
import { getCurrentDateTime } from '../utils/time.js';

// Create user jwt token
/*
    @param {number} userId - User id
    @param {string} token - User jwt token
    @returns {Promise<Object>} - User jwt token data
*/
const createUserJwtToken = async (userId, token) => {
    // Insert user jwt token
    const [result] = await db.execute(
        'INSERT INTO user_jwt_tokens (user_id, token, created_at) VALUES (?, ?, ?)',
        [userId, token, getCurrentDateTime()]
    );
    
    // Return user jwt token data
    return { id: result.insertId, userId, token };
}

// Update user jwt token
/*
    @param {number} userId - User id
    @param {string} token - User jwt token
    @returns {Promise<Object>} - User jwt token data
*/
const updateUserJwtToken = async (userId, token) => {
    // Update user jwt token
    await db.execute(
        'UPDATE user_jwt_tokens SET token = ? WHERE user_id = ?',
        [token, userId]
    );
    
    // Return user jwt token data
    return { userId, token };
}

// Get user jwt token by user id
/*
    @param {number} userId - User id
    @returns {Promise<Object>} - User jwt token data
*/
const getUserJwtTokenByUserId = async (userId) => {
    // Get user jwt token by user id
    const [rows] = await db.execute(
        'SELECT * FROM user_jwt_tokens WHERE user_id = ?',
        [userId]
    );
    
    // Return user jwt token data
    return rows[0];
}

// Get user jwt token by token
/*
    @param {string} token - User jwt token
    @returns {Promise<Object>} - User jwt token data
*/
const getUserJwtTokenByToken = async (token) => {
    // Get user jwt token by token
    const [rows] = await db.execute(
        'SELECT * FROM user_jwt_tokens WHERE token = ?',
        [token]
    );
    
    // Return user jwt token data
    return rows[0];
}

// Delete user jwt token by user id
/*
    @param {number} userId - User id
    @returns {Promise<boolean>} - True if deleted
*/
const deleteUserJwtTokenByUserId = async (userId) => {
    // Delete user jwt token by user id
    await db.execute(
        'DELETE FROM user_jwt_tokens WHERE user_id = ?',
        [userId]
    );
    
    // Return true
    return true;
}

export default {
    createUserJwtToken,
    updateUserJwtToken,
    getUserJwtTokenByUserId,
    getUserJwtTokenByToken,
    deleteUserJwtTokenByUserId,
};