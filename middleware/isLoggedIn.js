const userModel = require("../models/user-model");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Support both cookies & headers
    logger.info("User auth middleware hit");

    if (!token) {
      logger.warn("Access denied. No user token provided");
      return res.status(401).json({ message: "Access denied. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      logger.warn(`Invalid token. User not found for ID: ${decoded.id}`);
      return res.status(401).json({ message: "Invalid token. User not found." });
    }

    req.user = user;
    logger.info(`User authenticated successfully: ${user.email}`);
    next();
  } catch (err) {
    logger.error("Error in user auth middleware", { error: err });
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};
