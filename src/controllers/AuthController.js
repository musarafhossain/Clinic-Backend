import { AuthModel } from '../models/index.js';
import bcrypt from 'bcrypt';
import generateJwtToken from '../utils/generateJwtToken.js';

const login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await AuthModel.loginUser(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const { jwtToken } = await generateJwtToken(user);

        if (user && user.password) {
            delete user.password;
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: jwtToken,
            user,
        });
    } catch (error) {
        next(error);
    }
};

export default{
    login,
}