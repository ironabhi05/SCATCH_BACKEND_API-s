const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const userModel = require("../models/user-model");
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

router.delete("/delete-user/:userid", isLoggedIn, async (req, res) => {
  const { userid } = req.params;

  try {
    const user = await userModel.findByIdAndDelete(userid);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User Deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: err });
  }
});

module.exports = router;
