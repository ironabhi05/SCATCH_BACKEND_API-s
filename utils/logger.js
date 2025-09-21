const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");

const logDir = path.join(process.cwd(), "logs");

// For creating Log folder in DEV phase in Root
if (process.env.NODE_ENV !== "production" && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Simple text format
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const msg = stack || message;
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level.toUpperCase()}] : ${msg}${metaStr}`;
  })
);

// Transport array
const transports = [];

// ------------------ DEVELOPMENT ------------------
if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "debug.log"),
      level: "debug",
      format: fileFormat,
    })
  );
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: fileFormat,
    })
  );
}

// ------------------ PRODUCTION ------------------
else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const msg = stack || message;
          const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : "";
          return `${timestamp} [${level.toUpperCase()}] : ${msg}${metaStr}`;
        })
      ),
      level: "info", 
    })
  );
}

// Logger create
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports,
  exitOnError: false,
});


module.exports = logger;
