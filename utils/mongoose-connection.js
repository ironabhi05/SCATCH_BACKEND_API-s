const mongoose = require("mongoose");
const logger = require("./logger");
require("dotenv").config();

// Connecting the database(MongoDB)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("✅ Database connected successfully");
  } catch (error) {
    logger.error("❌ Database connection failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1); // stop the app if DB connection fails
  }
};

module.exports = connectDB;
