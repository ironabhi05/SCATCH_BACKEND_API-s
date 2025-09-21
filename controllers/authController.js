const ownerModel = require("../models/owner-model");
const bcrypt = require("bcrypt");
const { generateAdminToken } = require("../utils/generateAdminToken");
const logger = require("../utils/logger"); 

module.exports.createOwner = async (req, res) => {
  try {
    logger.info(`CreateOwner API hit with email: ${req.body.email}`);

    const existingOwner = await ownerModel.findOne({ email: req.body.email });
    if (existingOwner) {
      logger.warn(`Owner creation failed, email already taken: ${req.body.email}`);
      return res.status(400).json({ message: "Email is already taken." });
    }

    let { fullname, password, email } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new owner
    let newOwner = await ownerModel.create({
      fullname,
      password: hashedPassword,
      email,
    });

    logger.info(`Owner created successfully: ${email} - ID: ${newOwner._id}`);

    // Generate the admin token
    let token = generateAdminToken(newOwner);

    // Set the token in a secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24,
      path: "/",
    });

    newOwner.password = undefined;

    return res.status(200).json({
      message: "Owner created successfully",
      owner: newOwner,
    });
  } catch (err) {
    logger.error("Error creating owner", { error: err });
    return res.status(500).json(err);
  }
};

module.exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info(`Admin login attempt: ${email}`);

    // Check if admin exists
    let isAdmin = await ownerModel.findOne({ email });
    if (!isAdmin) {
      logger.warn(`Admin login failed - email not found: ${email}`);
      return res.status(400).json({ message: "Email or Password Incorrect" });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, isAdmin.password);
    if (!passwordMatch) {
      logger.warn(`Admin login failed - incorrect password: ${email}`);
      return res.status(400).json({ message: "Email or Password Incorrect" });
    }

    // Generate JWT token
    let token = generateAdminToken(isAdmin);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    logger.info(`Admin logged in successfully: ${email}`);

    return res.status(200).json({
      message: "Admin login successful",
      admin: {
        id: isAdmin._id,
        email: isAdmin.email,
        role: "admin",
      },
      token,
    });
  } catch (error) {
    logger.error("Error during admin login", { error });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
