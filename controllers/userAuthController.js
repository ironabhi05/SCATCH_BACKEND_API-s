const emailService = require("../utils/emailServices");
const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");
const { generateResetToken } = require("../utils/generateResetToken");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const { generateOTP } = require("../utils/otpGenerator");

//CreateUser: Create a new user with the provided information
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
    // Send a welcome email to the user
    await emailService.sendWelcomeEmail(newUser.email);
    // Log the user creation
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

// UserSendOtp: Send OTP to user's email for password reset
module.exports.userSendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    // Input validation
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists by email
    const user = await userModel.findOne({ email });
    if (!user) {
      logger.warn(`Password reset attempt for non-existent email: ${email}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = await generateOTP(user);

    // Set OTP and expiry time in user model
    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpiry = Date.now() + 1000 * 60 * 10; // 10 minutes
    await user.save();

    // Send OTP to user's email
    try {
      await emailService.sendOtpResetEmail(user.email, otp);
      logger.info(`OTP sent successfully to: ${email}`);
    } catch (emailError) {
      logger.error(`Failed to send OTP email: ${emailError.message}`);
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }

    // Generate and set reset token
    const resetToken = generateResetToken(user);
    res.cookie("resetToken", resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 1000 * 60 * 10, // 10 minutes
    });

    return res.status(200).json({
      message: "OTP sent successfully",
      // Don't send OTP in response in production
      ...(process.env.NODE_ENV !== 'production' && { otp, resetToken })
    });

  } catch (error) {
    logger.error(`userSendOtp failed: ${error.stack || error.message}`);
    return res.status(500).json({ message: "An error occurred while processing your request" });
  }
};

// UserVerifyOtp: Verify the OTP for password reset
module.exports.userVerifyOtp = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  try {
    const token = req.cookies.resetToken;
    if (!token) {
      return res.status(400).json({ message: "Invalid or expired reset session" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await userModel.findById(decoded.id).select("+resetOtp +resetOtpExpiry");

    if (decoded.purpose !== "reset_password") {
      return res.status(403).json({ message: "Invalid token type" });
    }


    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check OTP existence and expiry
    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (Date.now() > user.resetOtpExpiry) {
      await user.updateOne({
        $unset: { resetOtp: 1, resetOtpExpiry: 1 }
      });
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP after successful verification
    await user.updateOne({
      $unset: { resetOtp: 1, resetOtpExpiry: 1 }
    });

    logger.info(`OTP verified for user: ${user.email}`);
    return res.status(200).json({
      message: "OTP verified successfully"
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    logger.error(`userVerifyOtp failed: ${error.stack || error.message}`);
    return res.status(500).json({ message: "An error occurred while verifying OTP" });
  }
};

// UserResetPassword: Reset the password after OTP verification
module.exports.userResetPassword = async (req, res) => {
  const { newPassword } = req.body;

  try {
    const token = req.cookies.resetToken;
    if (!token) {
      return res.status(400).json({ message: "Invalid or expired reset session" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (decoded.purpose !== "reset_password") {
      return res.status(403).json({ message: "Invalid token type" });
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the new password is different from the current one (if needed)
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from the current password" });
    }

    // Hash the new password (now safe with validation)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Clear the reset token cookie
    res.clearCookie("resetToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/"
    });

    // Send password changed notification
    try {
      await emailService.sendPasswordChangedEmail(user.email);
    } catch (emailError) {
      logger.error(`Failed to send password change email: ${emailError.message}`);
      // Don't fail the request if email fails
    }

    logger.info(`Password reset successfully for user: ${user.email}`);
    return res.status(200).json({ message: "Password has been reset successfully" });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    logger.error(`userResetPassword failed: ${error.stack || error.message}`);
    return res.status(500).json({ message: "An error occurred while resetting password" });
  }
};