const express = require("express");
const router = express.Router();
const ownerModel = require("../models/owner-model");
const bcrypt = require("bcrypt");
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
  res.clearCookie("token", "");
  res.redirect("/owners/admin/login");
});

router.get("/admin/login", (req, res) => {
  let error = req.flash("error");
  const { loggedin = false } = req.session;
  return res.json({
    error: error || null,
    loggedin: loggedin,
  });
});

router.get("/admin/panel", isAdminLoggedIn, async (req, res) => {
  try {
    let products = await productModel.find();
    let users = await userModel.find();
    let orders = await orderModel.find();
    let success = req.flash("success");
    const { loggedin = false } = req.session;
    return res.json({
      success: success || null,
      loggedin: loggedin,
      products: products,
      users: users,
      orders: orders,
    });
  } catch {
    console.error("Error fetching user orders:", error);
    res.status(500).send("Internal Server Error");
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
    console.error("Error fetching user orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/delete-user/:userid", isAdminLoggedIn, async (req, res) => {
  const { userid } = req.params;
  await userModel.findByIdAndDelete(userid);
  res.redirect("/owners/admin/panel");
});

router.delete(
  "/delete-product/:productid",
  isAdminLoggedIn,
  async (req, res) => {
    const { productid } = req.params;
    await productModel.findByIdAndDelete(productid);
    res.redirect("/shop");
  }
);

module.exports = router;
