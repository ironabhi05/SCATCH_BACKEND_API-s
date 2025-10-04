//Importing modules or libraries

const path = require("path");
const nodeEnv = process.env.NODE_ENV || "development";
require("dotenv").config({
  path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
});

const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const connectDB = require("./utils/mongoose-connection");
const ownerRouter = require("./routes/ownerRouter");
const productRouter = require("./routes/productRouter");
const userRouter = require("./routes/userRouter");
const orderRouter = require("./routes/orderRouter");
const indexRouter = require("./routes/index");
const chatRoute = require("./routes/chatBot.js");
const session = require("express-session");
const methodOverride = require("method-override");
const MongoStore = require("connect-mongo");
const logger = require("./utils/logger.js");

const cors = require("cors");

const PORT = process.env.PORT || 5000;

// ---------------- DATABASE CONNECTION ----------------
connectDB();

//Session - Cookies Setup
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
  })
);
logger.info("Session middleware configured");

// ---------------- MIDDLEWARE ----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
logger.info("Express middlewares applied");


// ---------------- CORS SETUP ----------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://scatch-mart.netlify.app",
  "https://hoppscotch.io",
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        const msg = `Blocked CORS request from origin: ${origin}`;
        logger.error(msg);
        callback(new Error(msg));
      }
    },
    credentials: true,
  })
);
logger.info("CORS configured");

// ---------------- API ROUTES ----------------
app.use("/api/owners", ownerRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/", indexRouter);
app.use("/api", chatRoute);
logger.info("API routes configured");

// ---------------- BASE ROUTE ----------------
app.get("/", (req, res) => {
  logger.info("Base route visited");
  res.send("Please visit:-  /api/scatch-products");
});

// ---------------- FRONTEND LOGS ENDPOINT (COMMENTED) ----------------
// app.post("/api/frontend-logs", (req, res) => {
//   logger.info("Frontend log", { body: req.body });
//   res.sendStatus(200);
// });

// ---------------- SERVER START ----------------
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT} 📡🚀🚀🚀`);
});
