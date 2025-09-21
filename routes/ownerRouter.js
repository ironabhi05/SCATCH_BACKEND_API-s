const express = require("express");
const router = express.Router();
const { createOwner, adminLogin } = require("../controllers/authController");
const userModel = require("../models/user-model");
const isAdminLoggedIn = require("../middleware/isAdminLoggedIn");
const productModel = require("../models/product-model");
const orderModel = require("../models/order-model");
const logger = require("../utils/logger");

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
    logger.info(`Admin logged out: ${req.admin?.email || "Unknown"}`);
    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    logger.error("Error during admin logout", { message: err.message, stack: err.stack });
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/admin/panel", isAdminLoggedIn, async (req, res) => {
  try {
    let products = await productModel.find();
    let users = await userModel.find();
    let orders = await orderModel.find();

    logger.info(`Admin panel accessed by: ${req.admin?.email || "Unknown"}`);
    return res.json({
      loggedin: true,
      adminDetails: req.admin,
      products: products,
      users: users,
      orders: orders,
    });
  } catch (err) {
    logger.error("Error fetching admin panel data", { message: err.message, stack: err.stack });
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/delete-product/:productid", isAdminLoggedIn, async (req, res) => {
  const { productid } = req.params;
  try {
    const product = await productModel.findByIdAndDelete(productid);

    if (!product) {
      logger.info(`Attempted to delete non-existing product: ${productid}`);
      return res.status(404).json({ message: "Product not found" });
    }

    logger.info(`Product deleted by admin ${req.admin?.email || "Unknown"}: ${productid}`);
    return res.status(200).json({message: "Product Deleted", product: product  });
  } catch (err) {
    logger.error("Error deleting product", { message: err.message, stack: err.stack });
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/admin/delete-user/:userid", isAdminLoggedIn, async (req, res) => {
  const { userid } = req.params;
  try {
    const user = await userModel.findByIdAndDelete(userid);

    if (!user) {
      logger.info(`Attempted to delete non-existing user: ${userid}`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`User deleted by admin ${req.admin?.email || "Unknown"}: ${userid}`);
    return res.status(200).json({ message: "User Deleted" });
  } catch (err) {
    logger.error("Error deleting user", { message: err.message, stack: err.stack });
    return res.status(500).json({ message: "Internal Server Error", error: err });
  }
});

module.exports = router;
