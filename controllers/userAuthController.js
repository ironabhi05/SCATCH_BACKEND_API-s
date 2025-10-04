const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/emailServices");

// CreateUser: Create a new user with the provided information
module.exports.createUser = async (req, res) => {
  try {
    let { fullname, email, password, cart, contact, picture } = req.body;

    // Check if user already exists
    let userExist = await userModel.findOne({ email });
    if (userExist) {
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

    await sendMail("welcome", email);

    logger.info(`User created successfully: ${newUser.email}`);
    return res
      .status(201)
      .json({ message: "User created successfully!", user: newUser, token });
  } catch (err) {
    logger.error(`createUser failed: ${err.stack || err.message}`);
    return res.status(500).json(err);
  }
};

//UserLogin: Login the user with the provided email and password
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
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });
    logger.info(`User logged in successfully: ${isUser.email}`);
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
    logger.error(`userLogin failed: ${err.stack || err.message}`);
    return res.status(500).json(err);
  }
};

//GetUser: Get the user with the provided ID
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
    return res.status(500).json(err);
  }
};

//UserLogout: Logout the user
module.exports.userLogout = (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(200).json({ message: "You are already logged out." });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    logger.info(`User logged out successfully: ${req.user.email}`);
    return res.status(200).json({
      message: "You have been logged out successfully.",
    });
  } catch (err) {
    logger.error(`userLogout failed: ${err.stack || err.message}`);
    return res.status(500).json({
      message: "Something went wrong while logging out.",
      error: err.message || "Internal Server Error",
    });
  }
};

//DeleteUserSelf: Delete the user with the provided ID
module.exports.deleteUserSelf = async (req, res) => {
  const { userid } = req.params;

  try {
    const user = await userModel.findByIdAndDelete(userid);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    logger.info(`User deleted successfully: ${user.email}`);
    return res.status(200).json({ message: "User Deleted" });
  } catch (err) {
    logger.error(`deleteUserSelf failed: ${err.stack || err.message}`);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err });
  }
};

//UserSendOtp: Send OTP to user's email for password reset
module.exports.userSendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user exists by email
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Generate JWT token for the user
    const token = generateToken(user);

    // Set token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 20), // 20 minutes
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP and expiry in user document
    const expiry = Date.now() + 2 * 60 * 1000; // 2 minutes
    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    // Send OTP to user's email
    await sendMail("otp_reset", email, otp);

    // Return token for OTP verification along with confirmation
    logger.info(`OTP sent successfully: ${email}`);
    return res.json({ message: "OTP sent successfully", otp, token });
  } catch (error) {
    logger.error(`userSendOtp failed: ${error.stack || error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

//UserVerifyOtp: Verify OTP for the user
module.exports.userVerifyOtp = async (req, res) => {
  const { otp } = req.body;
  try {
    // Check if token exists in cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Please enter a valid OTP" });
    }

    // Verify token and extract user info
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Find user by decoded email or id
    const user = await userModel.findOne({
      $or: [{ email: decoded.email }, { _id: decoded.id }],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Check if OTP is expired
    if (!user.resetOtpExpiry || user.resetOtpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired!" });
    }

    // Check if OTP is correct
    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ message: "Please enter a valid OTP" });
    }

    logger.info(`OTP verified successfully: ${user.email}`);
    return res.json({ message: "OTP verified successfully" });
  } catch (error) {
    logger.error(`userVerifyOtp failed: ${error.stack || error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

//UserResetPassword: Reset the user's password after verifying OTP
module.exports.userResetPassword = async (req, res) => {
  const { newPassword } = req.body;
  try {
    // Check if token exists in cookies
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Please verify OTP first." });
    }

    // Verify token and extract user info
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Find user by decoded email or id
    const user = await userModel.findOne({
      $or: [{ email: decoded.email }, { _id: decoded.id }],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);


    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    // Send OTP to user's email
    await sendMail("password_changed", user.email);
    
    logger.info(`Password reset successfully: ${user.email}`);
    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    logger.error(`userResetPassword failed: ${error.stack || error.message}`);
    return res.status(500).json({ error: error.message });
  }
};
