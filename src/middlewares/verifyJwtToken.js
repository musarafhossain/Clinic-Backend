import jwt from "jsonwebtoken";
import UserJwtTokenModel from "../models/UserJwtTokenModel.js";
import UserModel from "../models/UserModel.js";

// Verify jwt token
const verifyJwtToken = async (req, res, next) => {
    try {
        // Get jwt token from header
        const authHeader = req.headers['authorization'];
        const jwtToken = authHeader?.split(' ')[1];

        // Check if jwt token is present
        if (!jwtToken) {
            return res.status(401).json({
                success: false,
                message: "Authorization token missing",
            });
        }

        // Get user jwt token
        const privateKey = process.env.JWT_TOKEN_SECRET_KEY;
        const tokenRecord = await UserJwtTokenModel.getUserJwtTokenByToken(jwtToken);

        // Check if user jwt token is present
        if (!tokenRecord) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        // Verify jwt token
        let decoded;
        try {
            decoded = jwt.verify(jwtToken, privateKey);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        // Get user by id
        const user = await UserModel.getUserById(decoded.id);

        // Check if user is present
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Set user in req
        req.user = user;

        // Call next middleware
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