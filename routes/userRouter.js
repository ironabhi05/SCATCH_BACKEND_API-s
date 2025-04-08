const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const {
  createUser,
  userLogin,
  userLogout,
  getUser,
} = require("../controllers/userAuthController");

router.post("/create", createUser);

router.post("/login", userLogin);

router.post("/logout", userLogout);

router.get("/profile", isLoggedIn, getUser);

module.exports = router;
