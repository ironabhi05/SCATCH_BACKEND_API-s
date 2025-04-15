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

router.get("/admin/users", isAdminLoggedIn, async (req, res) => {
  try {
    // Get all users
    let users = await userModel.find();

    // Get orders for all users
    let orders = await orderModel
      .find({ user: { $in: users.map((u) => u._id) } })
      .populate("items.product");

    // Map orders to each user
    let userOrders = users.map((user) => {
      // Get orders for each user
      let userOrdersList = orders.filter(
        (order) => order.user.toString() === user._id.toString()
      );

      // For each order, add item length to the order
      userOrdersList = userOrdersList.map((order) => {
        return {
          ...order.toObject(),
          itemCount: order.items.length, // Add item count to the order
        };
      });

      return {
        user,
        orders: userOrdersList, // Return the user with their orders and item counts
      };
    });

    const { loggedin = false } = req.session;
    return res.json({
      loggedin: loggedin,
      userOrders: userOrders,
      users: users,
    });
  } catch (error) {
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
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

module.exports = router;
