const mongoose = require("mongoose");
const dbgr = require("debug")("development:Connection");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/Scatch";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI); // Removed deprecated options
    dbgr("✅ Database Connected Successfully 💾");
  } catch (error) {
    dbgr(`❌ Database Connection Failed: ${error.message}`);
    process.exit(1); // Exit process if DB connection fails
  }
};

module.exports = connectDB;
