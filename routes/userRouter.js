const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const userModel = require("../models/user-model");
const {
  createUser,
  userLogin,
  userSendOtp,
  userVerifyOtp,
  userLogout,
  userResetPassword,
  deleteUserSelf,
  getUser,
} = require("../controllers/userAuthController");

router.post("/create", createUser);

router.post("/login", userLogin);

router.post("/logout", userLogout);

router.get("/profile", isLoggedIn, getUser);

router.post("/send-otp", userSendOtp);

router.post("/verify-otp", isLoggedIn, userVerifyOtp);

router.post("/reset-password", isLoggedIn, userResetPassword);

router.delete("/delete-user/:userid", isLoggedIn, deleteUserSelf);

module.exports = router;
