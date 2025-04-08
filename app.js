const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const app = express();
const dbgr = require("debug")("development: Server");
const connectDB = require("./utils/mongoose-connection");
const ownerRouter = require("./routes/ownerRouter");
const productRouter = require("./routes/productRouter");
const userRouter = require("./routes/userRouter");
const indexRouter = require("./routes/index");
const session = require("express-session");
const methodOverride = require("method-override");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`
});

connectDB();


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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));

const allowedOrigins = [
  "http://localhost:5173",
  "https://scatch-mart.netlify.app",
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use("/api/owners", ownerRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/", indexRouter);

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
// });

app.listen(PORT, () => {
  dbgr(`🌐Server is running on Port ${PORT}📡🚀🚀🚀`);
});
