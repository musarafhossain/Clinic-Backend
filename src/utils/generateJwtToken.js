import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import UserJwtTokenModel from '../models/UserJwtTokenModel.js';

dotenv.config();

// Generate JWT token
/*
    @param {Object} user - The user object
    @returns {Promise<{jwtToken: string, jwtTokenExp: number}>} - The JWT token and expiration time
*/
const generateJwtToken = async (user) => {
    try {
        // Create payload
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
        };

        // Set jwt token expiration time (5 days from now)
        const jwtTokenExp = Math.floor(Date.now() / 1000) + 10/*  * 60 * 24 * 5 */;

        // Generate JWT token
        const jwtToken = jwt.sign(
            { ...payload, exp: jwtTokenExp },
            process.env.JWT_TOKEN_SECRET_KEY,
        );

        // Delete old JWT token
        await UserJwtTokenModel.deleteUserJwtTokenByUserId(user.id);

        // Create new JWT token
        await UserJwtTokenModel.createUserJwtToken(user.id, jwtToken);

        // Return JWT token and expiration time
        return Promise.resolve({ jwtToken, jwtTokenExp });
    } catch (error) {
        return Promise.reject(error);
    }
}

export default generateJwtToken;