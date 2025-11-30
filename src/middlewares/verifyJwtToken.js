import jwt from "jsonwebtoken";
import UserJwtTokenModel from "../models/UserJwtTokenModel.js";
import UserModel from "../models/UserModel.js";

const verifyJwtToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const jwtToken = authHeader?.split(' ')[1];
        if (!jwtToken) {
            return res.status(401).json({
                success: false,
                message: "Authorization token missing",
            });
        }
        const privateKey = process.env.JWT_TOKEN_SECRET_KEY;
        const tokenRecord = await UserJwtTokenModel.getUserJwtTokenByToken(jwtToken);
        if (!tokenRecord) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }
        let decoded;
        try {
            decoded = jwt.verify(jwtToken, privateKey);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }
        const user = await UserModel.getUserById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        next();
    } catch (error) {
        console.error("JWT middleware error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export default verifyJwtToken;
