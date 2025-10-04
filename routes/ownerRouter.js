const express = require("express");
const router = express.Router();
const isAdminLoggedIn = require("../middleware/isAdminLoggedIn");
const {
  createOwner,
  adminLogin,
  adminLogout,
  adminPanel,
  adminDeleteProduct,
  adminDeleteUser,
} = require("../controllers/authController"); // admin controllers

// for create admin in development mode
if (process.env.NODE_ENV === "development") {
  router.post("/create", createOwner);
}

// for login route for Admin
router.post("/admin/login", adminLogin);

// for logout route for Admin
router.post("/admin/logout", isAdminLoggedIn, adminLogout);

// for admin panel route for Admin
router.get("/admin/panel", isAdminLoggedIn, adminPanel);

// for delete a product route for Admin
router.delete(
  "/delete-product/:productid",
  isAdminLoggedIn,
  adminDeleteProduct
);

// for delete a user route for Admin
router.delete("/admin/delete-user/:userid", isAdminLoggedIn, adminDeleteUser);

module.exports = router;
