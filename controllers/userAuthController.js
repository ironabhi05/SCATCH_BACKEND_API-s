const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");
const logger = require("../utils/logger");

module.exports.createUser = async (req, res) => {
  try {
    logger.info(`CreateUser API hit with email: ${req.body.email}`);

    let { fullname, email, password, cart, contact, picture } = req.body;

    // Check if user already exists
    let userExist = await userModel.findOne({ email });
    if (userExist) {
      logger.warn(`User creation failed, email already exists: ${email}`);
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    let newUser = await userModel.create({
      fullname,
      email,
      contact,
      cart: cart || [],
      password: hashedPassword,
      picture,
    });

    logger.info(`User created successfully: ${email} - ID: ${newUser._id}`);

    // Generate JWT token
    let token = generateToken(newUser);

    // Set token as a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    return res
      .status(201)
      .json({ message: "User created successfully!", user: newUser, token });
  } catch (err) {
    logger.error("Error creating user", { error: err });
    return res.status(500).json(err);
  }
};

module.exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info(`User login attempt: ${email}`);

    // Check if user exists
    const isUser = await userModel.findOne({ email });
    if (!isUser) {
      logger.warn(`User login failed - email not found: ${email}`);
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, isUser.password);
    if (!isMatch) {
      logger.warn(`User login failed - incorrect password: ${email}`);
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    // Generate JWT token
    const token = generateToken(isUser);

    // Set token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    logger.info(`User logged in successfully: ${email}`);

    return res.status(200).json({
      message: "Login successful!",
      user: {
        id: isUser._id,
        fullname: isUser.fullname,
        email: isUser.email,
        contact: isUser.contact,
        picture: isUser.picture,
      },
      token,
    });
  } catch (err) {
    logger.error("Error during user login", { error: err });
    return res.status(500).json(err);
  }
};

module.exports.getUser = async (req, res) => {
  try {
    logger.info(
      `GetUser API hit by user ID: ${req.user ? req.user._id : "unauthorized"}`
    );

    if (!req.user) {
      logger.warn("Unauthorized user tried to access /getUser");
      return res.status(401).json({
        message: "Unauthorized access. Please log in.",
      });
    }

    return res.status(200).json({
      message: "User found",
      user: {
        id: req.user._id,
        fullname: req.user.fullname,
        email: req.user.email,
        contact: req.user.contact,
        picture: req.user.picture,
      },
    });
  } catch (err) {
    logger.error("Error fetching user", { error: err });
    return res.status(500).json(err);
  }
};

module.exports.userLogout = (req, res) => {
  try {
    logger.info(`User logout attempt: ${req.user ? req.user._id : "unknown"}`);

    const token = req.cookies.token;

    if (!token) {
      logger.warn("User tried to logout but was already logged out");
      return res.status(200).json({ message: "You are already logged out." });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    logger.info(
      `User logged out successfully: ${req.user ? req.user._id : "unknown"}`
    );

    return res.status(200).json({
      message: "You have been logged out successfully.",
    });
  } catch (err) {
    logger.error("Error during user logout", { error: err });
    return res.status(500).json({
      message: "Something went wrong while logging out.",
      error: err.message || "Internal Server Error",
    });
  }
};
