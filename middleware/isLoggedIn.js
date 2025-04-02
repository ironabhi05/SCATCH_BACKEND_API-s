const userModel = require("../models/user-model");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Support both cookies & headers

    if (!token) {
      return res.status(401).json({ message: "Access denied. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await userModel.findById(decoded.userId).select("-password"); // Use _id instead of email

    if (!user) {
      return res.status(401).json({ message: "Invalid token. User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};
