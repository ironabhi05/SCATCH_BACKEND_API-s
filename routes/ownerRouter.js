const express = require("express");
const router = express.Router();
const { createOwner, adminLogin } = require("../controllers/authController");
const userModel = require("../models/user-model");
const isAdminLoggedIn = require("../middleware/isAdminLoggedIn");
const productModel = require("../models/product-model");
const orderModel = require("../models/order-model");

if (process.env.NODE_ENV === "development") {
  router.post("/create", createOwner);
}

router.post("/admin/login", adminLogin);

router.post("/admin/logout", isAdminLoggedIn, (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/admin/panel", isAdminLoggedIn, async (req, res) => {
  try {
    let products = await productModel.find();
    let users = await userModel.find();
    let orders = await orderModel.find();
    return res.json({
      loggedin: true,
      adminDetails: req.admin,
      products: products,
      users: users,
      orders: orders,
    });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete(
  "/delete-product/:productid",
  isAdminLoggedIn,
  async (req, res) => {
    const { productid } = req.params;

    try {
      // Find and delete the product by its ID
      const product = await productModel.findByIdAndDelete(productid);

      // If the product doesn't exist
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Redirect to the shop page if successful
      return res
        .status(200)
        .json({ message: "Product Deleted", product: product });
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.delete(
  "/admin/delete-user/:userid",
  isAdminLoggedIn,
  async (req, res) => {
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
  }
);

module.exports = router;
