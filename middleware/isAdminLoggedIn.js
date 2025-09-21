const ownerModel = require("../models/owner-model");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Support both cookies & headers
    logger.info("Admin auth middleware hit");

    if (!token) {
      logger.warn("Access denied. No token provided");
      return res.status(401).json({ message: "Access denied. Please log in as admin." });
    }

    const decoded = jwt.verify(token, process.env.JWT_ADMIN_KEY);
    const admin = await ownerModel.findById(decoded.adminId).select("-password"); // Use _id instead of email

    if (!admin) {
      logger.warn(`Invalid token. Admin not found for ID: ${decoded.adminId}`);
      return res.status(401).json({ message: "Invalid token. Admin not found." });
    }

    req.admin = admin;
    logger.info(`Admin authenticated successfully: ${admin.email}`);
    next();
  } catch (err) {
    logger.error("Error in admin auth middleware", { error: err });
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};
