const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

module.exports.createUser = async (req, res) => {
  try {
    let { fullname, email, password, cart, contact, picture } = req.body;

    // Check if user already exists
    let userExist = await userModel.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password using bcrypt (with async/await)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    let newUser = await userModel.create({
      fullname,
      email,
      contact,
      cart: cart || [], // Default empty array if not provided
      password: hashedPassword,
      picture,
    });

    // Generate JWT token
    let token = generateToken(newUser);

    // Set token as a cookie (secure options added)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000, // 1 hour
    });

    return res
      .status(201)
      .json({ message: "User created successfully!", user: newUser, token });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

module.exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const isUser = await userModel.findOne({ email });
    if (!isUser) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, isUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    // Generate JWT token
    const token = generateToken(isUser);

    // Set token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000, // 1 hour
      path: "/", // Ensure same path for logout to clear it
    });

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
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};


module.exports.getUser = async (req, res) => {
  try {
    if (!req.user) {
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
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

module.exports.userLogout = (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(200).json({ message: "You are already logged out." });
    }

    // Explicitly clear the token cookie with exact same options used when setting it
    res.clearCookie("token", {
      path: "/", // Must match exactly
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Must match how it was set
      sameSite: "Strict", // Use capital 'S' for consistency, though not case-sensitive
    });

    return res.status(200).json({
      message: "You have been logged out successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong while logging out.",
      error: err.message || "Internal Server Error",
    });
  }
};

