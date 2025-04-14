const ownerModel = require("../models/owner-model");
const bcrypt = require("bcrypt");
const { generateAdminToken } = require("../utils/generateAdminToken");

module.exports.createOwner = async (req, res) => {
  try {
    const existingOwner = await ownerModel.findOne({ email: req.body.email });
    if (existingOwner) {
      return res.status(400).json({ message: "Email is already taken." });
    }

    let { fullname, password, email } = req.body;

    // Hash the password using bcrypt with async/await
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new owner
    let newOwner = await ownerModel.create({
      fullname,
      password: hashedPassword,
      email,
    });

    // Generate the admin token
    let token = generateAdminToken(newOwner);

    // Set the token in a secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None", // Allow sending cookies across domains
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      path: "/", // Ensures it's available across all routes
    });

    // Return the new owner object (you can omit the password)
    newOwner.password = undefined;

    return res.status(200).json({
      message: "Owner created successfully",
      owner: newOwner,
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports.adminLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Check if admin exists
    let isAdmin = await ownerModel.findOne({ email });
    if (!isAdmin) {
      return res.status(400).json({ message: "Email or Password Incorrect" });
    }

    // Compare passwords using async/await
    const passwordMatch = await bcrypt.compare(password, isAdmin.password);
    if (!passwordMatch) {
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
    return res.status(500).json(err);
  }
};
