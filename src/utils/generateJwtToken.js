import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserJwtTokenModel } from '../models/index.js';

dotenv.config();

const generateJwtToken = async (user) => {
    try {
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
        };

        const jwtTokenExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 5; //Set expiration to 5 days from now
        const jwtToken = jwt.sign(
            { ...payload, exp: jwtTokenExp },
            process.env.JWT_TOKEN_SECRET_KEY,
        );

        await UserJwtTokenModel.deleteUserJwtTokenByUserId(user.id);
        await UserJwtTokenModel.createUserJwtToken(user.id, jwtToken);

        return Promise.resolve({ jwtToken, jwtTokenExp });
    } catch (error) {
        return Promise.reject(error);
    }
}

export default generateJwtToken;