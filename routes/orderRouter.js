const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const isAdminLoggedIn = require("../middleware/isAdminLoggedIn");
const {
  placeOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

// User routes - require authentication
router.post("/place-order", isLoggedIn, placeOrder);
router.get("/my-orders", isLoggedIn, getUserOrders);
router.post("/cancel/:orderId", isLoggedIn, cancelOrder);



// Admin routes - require admin authentication
router.get("/admin/all", isAdminLoggedIn, getAllOrders);
router.post("/admin/:orderId/status", isAdminLoggedIn, updateOrderStatus);

module.exports = router;
