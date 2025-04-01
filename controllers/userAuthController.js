const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

module.exports.createUser = async (req, res) => {
  try {
    let { fullname, email, password } = req.body;
    let userExist = await userModel.findOne({ email: email });
    if (!userExist) {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
          let newUser = await userModel.create({
            fullname,
            email,
            password: hash,
          });
          let token = generateToken(newUser);
          res.cookie("token", token);
          return res.redirect("/api/users/profile");
        });
      });
    } else {
      req.flash("error", "User Already Exist");
      return res.redirect("/api");
    }
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }
};

module.exports.userLogin = async (req, res) => {
  try {
    let { email, password } = req.body;
    let isUser = await userModel.findOne({ email: email });
    if (!isUser) {
      req.flash("error", "Email or Password incorrect");
      return res.redirect("/api");
    }
    bcrypt.compare(password, isUser.password, (err, result) => {
      if (result) {
        let token = generateToken(isUser);
        res.cookie("token", token);
        return res.redirect(`/api/users/profile`);
      } else {
        req.flash("error", "Email or Password incorrect");
        return res.redirect("/api");
      }
    });
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }
};

module.exports.getUser = (req, res) => {
  if (req.user) {
    return res.status(200).json({
      message: "User found",
      user: req.user,
    });
  } else {
    return res.status(401).json({
      message: "Unauthorized access. Please log in.",
    });
  }
};

module.exports.userLogout = (req, res) => {
  try {
    res.clearCookie("token", { path: "/", httpOnly: true });
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
