const ownerModel = require("../models/owner-model");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Support both cookies & headers

    if (!token) {
      return res.status(401).json({ message: "Access denied. Please log in as admin." });
    }

    const decoded = jwt.verify(token, process.env.JWT_ADMIN_KEY);
    const admin = await ownerModel.findById(decoded.adminId).select("-password"); // Use _id instead of email

    if (!admin) {
      return res.status(401).json({ message: "Invalid token. Admin not found." });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};
