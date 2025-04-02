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
const flash = require("connect-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const MongoStore = require("connect-mongo");
const PORT = process.env.PORT || 5000;
require("dotenv").config();


connectDB();


app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only set secure cookies in production
      maxAge: 3600000, // 1 hour
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,  // Using the correct MongoDB URI from the environment variable
      ttl: 14 * 24 * 60 * 60,  // Session TTL (optional)
    }),
  })
);


app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Serve static files from React build
// app.use(express.static(path.join(__dirname, "frontend/build")));
app.use(methodOverride("_method"));
// app.set("view engine", "ejs");

app.use("/api/owners", ownerRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/", indexRouter);


// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
// });
console.log(process.env.NODE_ENV);
app.listen(PORT, () => {  
  dbgr(`🌐Server is running on Port ${PORT}📡🚀🚀🚀`);
});
