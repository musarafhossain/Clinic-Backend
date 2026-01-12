import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";

const verifyJwtToken = async (req, res, next) => {
  try {
    // 1. Read token ONLY from cookie
    const token = req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3. Load user
    const user = await UserModel.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4. Attach user
    req.user = user;

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
