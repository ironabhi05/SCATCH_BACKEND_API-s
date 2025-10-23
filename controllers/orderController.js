const orderModel = require("../models/order-model");
const userModel = require("../models/user-model");
const productModel = require("../models/product-model");
const logger = require("../utils/logger");

// Place a new order
module.exports.placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const userId = req.user._id;

    logger.info(`Place order request from user: ${req.user.email}`);

    // Fetch user with cart
    const user = await userModel.findById(userId).populate("cart.product");

    if (!user || user.cart.length === 0) {
      logger.warn(`Cart is empty for user: ${req.user.email}`);
      return res.status(400).json({ message: "Cart is empty" });
    }

    const shippingCharge = 10;

    // Validate and calculate total
    const totalAmount = user.cart.reduce(
      (acc, item) =>
        acc + item.product.price * item.quantity + shippingCharge - item.product.price * item.quantity * (item.product.discount / 100),
      0
    );
    const totalQuantity = user.cart.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

    const orderItems = user.cart.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price - (item.product.price * item.product.discount / 100),
      status: "pending",
    }));

    // Create order
    const newOrder = await orderModel.create({
      user: userId,
      items: orderItems,
      totalAmount,
      totalQuantity,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
    });

    // Clear cart after placing order
    user.cart = [];
    await user.save();

    logger.info(
      `Order placed successfully from cart for user: ${req.user.email}`
    );
    return res.status(201).json({
      message: "Order placed successfully from cart",
      newOrder,
    });
  } catch (err) {
    logger.error(`Error placing order: ${err.stack || err.message}`);
    return res
      .status(500)
      .json({ message: "Failed to place order", error: err.message });
  }
};

// Get all orders for logged-in user
module.exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await orderModel
      .find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 });

    logger.info(`Fetched ${orders.length} orders for user: ${req.user.email}`);

    // Debug: Log shipping address data for each order
    // orders.forEach((order, index) => {
    //   logger.info(`Order ${index + 1} - Shipping Address:`, order.shippingAddress);
    //   if (!order.shippingAddress || Object.keys(order.shippingAddress).length === 0) {
    //     logger.warn(`Order ${order._id} missing shipping address data`);
    //   }
    // });

    return res.status(200).json({
      message: "Orders fetched successfully",
      orders,
    });
  } catch (err) {
    logger.error(`Error fetching user orders: ${err.stack || err.message}`);

    return res
      .status(500)
      .json({ message: "Failed to fetch orders", error: err.message });
  }
};

// // Get single order by ID
// module.exports.getOrderById = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const userId = req.user._id;

//     const order = await orderModel
//       .findOne({ _id: orderId, user: userId })
//       .populate("items.product");

//     if (!order) {
//       logger.warn(`Order not found: ${orderId} for user: ${req.user.email}`);
//       return res.status(404).json({ message: "Order not found" });
//     }

//     logger.info(`Order fetched: OrderID=${orderId}, User=${req.user.email}`);

//     return res.status(200).json({
//       message: "Order fetched successfully",
//       order,
//     });
//   } catch (err) {
//     logger.error(`Error fetching order by ID: ${err.stack || err.message}`);
//     return res
//       .status(500)
//       .json({ message: "Failed to fetch order", error: err.message });
//   }
// };

// Cancel an order (only if status is pending)
module.exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await orderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      logger.warn(
        `Cancel order failed - Order not found: ${orderId} for user: ${req.user.email}`
      );
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is already cancelled
    if (order.status === "cancelled") {
      logger.warn(
        `Cancel order failed - Order already cancelled: ${orderId}`
      );
      return res.status(400).json({
        message: "Order is already cancelled",
      });
    }

    // Check if order has been delivered or shipped
    if (order.status === "delivered") {
      logger.warn(
        `Cancel order failed - Order already delivered: ${orderId}`
      );
      return res.status(400).json({
        message: "Cannot cancel order because it has already been delivered",
      });
    }

    if (order.status === "shipped") {
      logger.warn(
        `Cancel order failed - Order already shipped: ${orderId}`
      );
      return res.status(400).json({
        message: "Cannot cancel order because it has already been shipped. Please contact customer support.",
      });
    }

    // Update order status to cancelled
    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId, user: userId },
      { status: "cancelled" },
      { new: true } // Return the updated document
    );

    logger.info(
      `Order cancelled successfully: OrderID=${orderId}, User=${req.user.email}`
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (err) {
    logger.error(`Error cancelling order: ${err.stack || err.message}`);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to cancel order",
        error: err.message
      });
  }
};

// Get all orders (Admin only)
module.exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("user", "fullname email contact")
      .populate("items.product")
      .sort({ createdAt: -1 });

    logger.info(
      `Admin fetched all orders: Total=${orders.length}, Admin=${req.admin?.email || "Unknown"
      }`
    );

    return res.status(200).json({
      message: "All orders fetched successfully",
      orders,
    });
  } catch (err) {
    logger.error(`Error fetching all orders: ${err.stack || err.message}`);
    return res
      .status(500)
      .json({ message: "Failed to fetch orders", error: err.message });
  }
};

// Update order item status (Admin only)
module.exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      logger.warn(`Invalid order status provided: ${status}`);
      return res.status(400).json({
        message: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      logger.warn(`Order not found for status update: ${orderId}`);
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    logger.info(
      `Order item status updated: OrderID=${orderId}, NewStatus=${status}, Admin=${req.admin?.email || "Unknown"
      }`
    );

    return res.status(200).json({
      message: "Order item status updated successfully",
      order,
    });
  } catch (err) {
    logger.error(
      `Error updating order item status: ${err.stack || err.message}`
    );
    return res
      .status(500)
      .json({
        message: "Failed to update order item status",
        error: err.message,
      });
  }
};
