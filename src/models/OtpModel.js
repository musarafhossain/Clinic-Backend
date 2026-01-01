import db from '../config/db.js';

// Create otp
/*
    @param {Object} otpData - Otp data
    @param {number} otpData.user_id - User id
    @param {string} otpData.otp - Otp
    @param {string} otpData.created_at - Otp created at
    @returns {Promise<Object>} - Otp data
*/
const createOtp = async (otpData) => {
    // Destructure otp data
    const { user_id, otp, created_at } = otpData;

    // Insert otp
    const [result] = await db.execute(
        'INSERT INTO otp (user_id, otp, created_at) VALUES (?, ?, ?)',
        [user_id, otp, created_at]
    );

    // Get created otp
    const createdOtp = await getOtpByUserId(user_id);

    // Return otp data
    return createdOtp;
}

// Get otp by user id
/*
    @param {number} userId - User id
    @returns {Promise<Object>} - Otp data
*/
const getOtpByUserId = async (userId) => {
    // Get otp by user id
    const [rows] = await db.execute(
        `SELECT * FROM otp WHERE user_id = ? LIMIT 1`,
        [userId]
    );

    // Return otp
    return rows[0] || null;
};

// Check otp exist
/*
    @param {string} otp - Otp
    @param {number} userId - User id
    @returns {Promise<boolean>} - Otp data
*/
const checkOtpExist = async (otp, userId) => {
    // Check otp exist
    const [existingOtp] = await db.execute(
        "SELECT otp FROM otp WHERE otp = ? AND user_id = ?",
        [otp, userId]
    );

    // Return existing or not
    return existingOtp.length > 0;
}

// Delete otp by user id
/*
    @param {number} userId - User id
    @returns {Promise<boolean>} - Otp data
*/
const deleteOtpByUserId = async (userId) => {
    // Delete otp
    await db.execute('DELETE FROM otp WHERE user_id = ?', [userId]);

    // Return true
    return true;
}

export default {
    createOtp,
    getOtpByUserId,
    checkOtpExist,
    deleteOtpByUserId,
};