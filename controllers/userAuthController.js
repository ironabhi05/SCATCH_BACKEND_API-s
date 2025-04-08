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
      secure: process.env.NODE_ENV === "production", // ✅ prod me HTTPS only
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // ✅ cross-site ke liye "None", warna "Lax"
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // ✅ 7 din valid
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
      secure: process.env.NODE_ENV === "production", // ✅ prod me HTTPS only
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // ✅ cross-site ke liye "None", warna "Lax"
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // ✅ 7 din valid
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

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // 👈 only true in prod
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/", // 👈 same as used while setting cookie
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
