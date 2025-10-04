const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const productModel = require("../models/product-model");
const logger = require("../utils/logger");
const {
  cartItemDelete,
  addToCart,
  getAddedItems,
} = require("../controllers/cartController.js");

router.get("/api", (req, res) => {
  try {
    logger.info("API test endpoint visited");
    return res.status(200).json({
      message: "API is running",
    });
  } catch (err) {
    logger.error("API test endpoint error", {
      message: err.message,
      stack: err.stack,
    });
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
    logger.error("Error fetching products", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: "Hmmm! Something went wrong...." });
  }
});

// Fetch product by ID
// This API is used to fetch a single product by its ID
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
    logger.error("Error fetching product by ID", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: "Hmmm! Something went wrong...." });
  }
});

// Add items to cart
router.post("/api/addtocart/", isLoggedIn, addToCart);

// Show all items in cart
router.get("/api/cart", isLoggedIn, getAddedItems);

// Delete items from cart
router.post("/api/cart/delete", isLoggedIn, cartItemDelete);

module.exports = router;
