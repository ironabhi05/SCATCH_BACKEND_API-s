const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");
const logger = require("../utils/logger");

router.get("/api", (req, res) => {
  try {
    logger.info("API test endpoint visited");
    return res.status(200).json({
      message: "API is running",
    });
  } catch (err) {
      logger.error("API test endpoint error", { message: err.message, stack: err.stack });
    return res.status(500).json({
      message: "Hmmm! Something went wrong....",
      error: err.message || "Internal Server Error",
    });
  }
});

// User Home Screen for shopping
router.get("/api/scatch-products", async (req, res) => {
  try {
    let products = await productModel.find();
    logger.info(`Fetched ${products.length} products for user`);
    return res.status(200).json({ products });
  } catch (error) {
    logger.error("Error fetching products", { message: error.message, stack: error.stack });
    return res.status(500).json({ message: "Hmmm! Something went wrong...." });
  }
});

router.get("/api/scatch-products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      logger.info(`Product not found for ID: ${id}`);
      return res.status(404).json({ message: "Product not found!" });
    }

    logger.info(`Product fetched successfully for ID: ${id}`);
    return res.status(200).json({ product });
  } catch (error) {
    logger.error("Error fetching product by ID", { message: error.message, stack: error.stack });
    return res.status(500).json({ message: "Hmmm! Something went wrong...." });
  }
});

// Add items to cart
router.post("/api/addtocart/", isLoggedIn, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push({ product: productId, quantity: quantity });
    await user.save();
    logger.info(`Item added to cart: ProductID=${productId}, Quantity=${quantity}, User=${req.user.email}`);
    return res.json({ message: "Item Added", cart: user.cart });
  } catch (err) {
    logger.error("Error adding item to cart", { message: err.message, stack: err.stack });
    return res.status(500).json(err);
  }
});

// Show all items in cart
router.get("/api/cart", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
    logger.info(`Cart fetched for user: ${req.user.email}, Items=${user.cart.length}`);
    return res.json({ cart: user.cart });
  } catch (err) {
    logger.error("Error fetching cart", { message: err.message, stack: err.stack });
    return res.status(500).json({ error: "Failed to get cart data" });
  }
});

// Delete items from cart
router.post("/api/cart/delete", isLoggedIn, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await userModel.findOne({ email: req.user.email });

    if (!user) {
      logger.info(`User not found while deleting cart item: ${req.user.email}`);
      return res.status(404).json({ message: "User not found" });
    }

    const prevCartLength = user.cart.length;
    user.cart = user.cart.filter((item) => item.product.toString() !== productId);
    await user.save();

    logger.info(
      `Removed product ${productId} from cart for user ${req.user.email}. Cart size: ${prevCartLength} -> ${user.cart.length}`
    );

    res.status(200).json({ message: "Item removed from cart", cart: user.cart });
  } catch (err) {
    logger.error("Error removing cart item", { message: err.message, stack: err.stack });
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

//Need to be corect
// //Place Order
// router.post("/api/order-place", isLoggedIn, async (req, res) => {
//   try {
//     // User fetch with populated cart
//     const user = await userModel
//       .findOne({ email: req.user.email })
//       .populate("cart");

//     if (!user || user.cart.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "No products in cart to place an order" });
//     }

//     // Find existing order for the user
//     let order = await orderModel.findOne({ user: user._id });

//     // Prepare cart items
//     const newItems = user.cart.map((product) => ({
//       product: product._id,
//       quantity: 1,
//       price: product.price,
//     }));

//     if (order) {
//       // User's order exists, push cart products into existing order's items
//       order.items.push(...newItems);

//       // Update total amount
//       order.totalAmount += newItems.reduce((sum, item) => sum + item.price, 0);

//       await order.save();
//     } else {
//       // No order exists, create a new one
//       order = new orderModel({
//         user: user._id,
//         items: newItems,
//         totalAmount: newItems.reduce((sum, item) => sum + item.price, 0),
//       });

//       await order.save();
//     }

//     // Empty user cart after order placement
//     user.cart = [];
//     await user.save();

//     req.flash("success", "Order Placed Successfully!");
//     return res.redirect("/shop");
//   } catch (error) {
//     console.error("Error placing order:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

module.exports = router;
