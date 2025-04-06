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

router.get("/admin/logout", isAdminLoggedIn, (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
    path: "/",
  });

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error clearing session.");
    }

    return res.status(200).json({ message: "Logout successful" });
  });
});

router.get("/admin/login", (req, res) => {
  try {
    let error = req.flash("error");
    const { loggedin = false } = req.session;
    return res.json({
      error: error || null,
      loggedin: loggedin,
    });
  } catch (err) {
    return res.status(500).send("Internal Server Error", err);
  }
});

router.get("/admin/panel", isAdminLoggedIn, async (req, res) => {
  try {
    let products = await productModel.find();
    let users = await userModel.find();
    let orders = await orderModel.find();
    const { loggedin = false } = req.session;
    return res.json({
      loggedin: loggedin,
      products: products,
      users: users,
      orders: orders,
    });
  } catch {
    return res.status(500).send("Internal Server Error");
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

router.delete("/delete-user/:userid", isAdminLoggedIn, async (req, res) => {
  const { userid } = req.params;

  try {
    // Attempt to delete the user by their ID
    const user = await userModel.findByIdAndDelete(userid);

    // If no user was found with that ID, send a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Redirect to the admin panel if the deletion was successful
    return res.status(200).json({ message: "User Deleted", user });
  } catch (err) {
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
