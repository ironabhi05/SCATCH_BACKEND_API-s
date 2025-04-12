const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");

router.get("/api", (req, res) => {
  try {
    // Send a success response
    return res.status(200).json({
      message: "API is running",
      error: error || null,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Hmmm! Something went wrong....",
      error: err.message || "Internal Server Error",
    });
  }
});

//User Home Screen for shopping
router.get("/api/scatch-products", async (req, res) => {
  try {
    let products = await productModel.find();

    return res.status(200).json({
      products,
    });
  } catch (error) {
    return res.status(500).json({ message: "Hmmm! Something went wrong...." });
  }
});

router.get("/api/scatch-products/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get the product ID from URL params

    // Find the product by ID in the database
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: "Hmmm! Something went wrong...." });
  }
});

//Add items to cart Page
router.post("/api/addtocart/", isLoggedIn, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push({ product: productId, quantity: quantity });
    await user.save();
    return res.json({ message: "Item Added", cart: user.cart });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

//Show all items to cart Page
router.get("/api/cart", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("cart.product");
    return res.json({ cart: user.cart });
  } catch (err) {
    console.error("Error fetching cart:", err);
    return res.status(500).json({ error: "Failed to get cart data" });
  }
});

//Delete items from the cart Page
router.post("/api/cart/delete", isLoggedIn, async (req, res) => {
  try {
    const { productId } = req.body;

    const user = await userModel.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out the product from the cart
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );
    await user.save();

    res
      .status(200)
      .json({ message: "Item removed from cart", cart: user.cart });
  } catch (err) {
    console.error("Error removing cart item:", err);
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
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
