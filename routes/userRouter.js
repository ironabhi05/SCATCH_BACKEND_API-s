const express = require("express");
const router = express.Router();
const userModel = require("../models/user-model");
const isLoggedIn = require("../middleware/isLoggedIn");
const {
  createUser,
  userLogin,
  userLogout,
  getUser,
} = require("../controllers/userAuthController");

router.post("/register", createUser);

router.post("/login", userLogin);

router.get("/logout", isLoggedIn, userLogout);

router.get("/profile", isLoggedIn, getUser);

module.exports = router;
