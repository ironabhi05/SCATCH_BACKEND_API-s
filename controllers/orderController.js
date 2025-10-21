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
    orders.forEach((order, index) => {
      logger.info(`Order ${index + 1} - Shipping Address:`, order.shippingAddress);
      if (!order.shippingAddress || Object.keys(order.shippingAddress).length === 0) {
        logger.warn(`Order ${order._id} missing shipping address data`);
      }
    });

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

// Get single order by ID
module.exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await orderModel
      .findOne({ _id: orderId, user: userId })
      .populate("items.product");

    if (!order) {
      logger.warn(`Order not found: ${orderId} for user: ${req.user.email}`);
      return res.status(404).json({ message: "Order not found" });
    }

    logger.info(`Order fetched: OrderID=${orderId}, User=${req.user.email}`);

    return res.status(200).json({
      message: "Order fetched successfully",
      order,
    });
  } catch (err) {
    logger.error(`Error fetching order by ID: ${err.stack || err.message}`);
    return res
      .status(500)
      .json({ message: "Failed to fetch order", error: err.message });
  }
};

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

    const hasNonPendingItem = order.items.some(
      (item) => item.status !== "pending"
    );

    if (hasNonPendingItem) {
      logger.warn(
        `Cancel order failed - Order has non-pending items: ${orderId}`
      );
      return res.status(400).json({
        message:
          "Cannot cancel order because one or more items are already processed",
      });
    }

    order.items.forEach((item) => {
      item.status = "cancelled";
    });
    await order.save();

    logger.info(
      `Order cancelled successfully: OrderID=${orderId}, User=${req.user.email}`
    );

    return res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    logger.error(`Error cancelling order: ${err.stack || err.message}`);
    return res
      .status(500)
      .json({ message: "Failed to cancel order", error: err.message });
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
    const { status, itemProductId, itemId } = req.body;

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

    if (!itemProductId && !itemId) {
      logger.warn("Order item identifier missing for status update");
      return res.status(400).json({
        message: "Provide either itemProductId or itemId to update item status",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      logger.warn(`Order not found for status update: ${orderId}`);
      return res.status(404).json({ message: "Order not found" });
    }

    const orderItem = order.items.find((item) => {
      if (itemId && item._id.toString() === itemId) {
        return true;
      }

      if (itemProductId && item.product.toString() === itemProductId) {
        return true;
      }

      return false;
    });

    if (!orderItem) {
      logger.warn(
        `Order item not found for status update: OrderID=${orderId}, ItemProductId=${itemProductId || "N/A"
        }, ItemId=${itemId || "N/A"}`
      );
      return res.status(404).json({ message: "Order item not found" });
    }

    orderItem.status = status;
    await order.save();

    logger.info(
      `Order item status updated: OrderID=${orderId}, NewStatus=${status}, Admin=${req.admin?.email || "Unknown"
      }`
    );

    return res.status(200).json({
      message: "Order item status updated successfully",
      orderItem,
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
