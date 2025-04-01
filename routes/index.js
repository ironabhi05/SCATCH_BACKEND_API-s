const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");

router.get("/api", (req, res) => {
  try {
    let error = req.flash("error");
    
    // Send a success response
    return res.status(200).json({
      message: "API is running",
      error: error || null
    });
  } catch (err) {
    return res.status(500).json({
      message: "Hmmm! Something went wrong....",
      error: err.message || "Internal Server Error"
    });
  }
});


//User Home Screen for shopping
router.get("/api/shop", async (req, res) => {
  try {
    const { loggedin = false, isAdminLoggedIn = false } = req.session;
    let products = await productModel.find();
    let success = req.flash("success");
    let error = req.flash("error");

    return res.status(200).json({
      products
    });
  } catch (error) {
    return res.status(500).json({ message: "Hmmm! Something went wrong...." });
  }
});

//Show One Product item
router.get("/api/shop/:productid", async (req, res) => {
  try {
    const { loggedin = false, isAdminLoggedIn = false } = req.session;
    const { productid } = req.params;

    let productDetails = await productModel.findById(productid);
    if (!productDetails) {
      return res.status(404).json({ message: "Product not found" });
    }

    let success = req.flash("success");
    let error = req.flash("error");

    return res.status(200).json({
      product: productDetails,
      success,
      error,
      isAdminLoggedIn,
      loggedin,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching product details" });
  }
});

//Add items to cart Page
router.get("/api/addtocart/:productid", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push(req.params.productid);
    await user.save();
    req.flash("success", "Item Added To Your Cart");
    return res.send("get add to cart Route");
  } catch {
    req.flash("error", "Hmmm! Something went wrong....");
    return res.status(500).send("Hmmm! Can't Reach...");
  }
});

router.get("/api/cart", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel
      .findOne({ email: req.user.email })
      .populate("cart");
    let product = await productModel.findById();
    return res.json({ user, products: user.cart });
  } catch {
    return res.status(500).send("Hmmm! Something went wrong....");
  }
});

//Place Order
router.post("/api/order-place", isLoggedIn, async (req, res) => {
  try {
    // User fetch with populated cart
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("cart");

    if (!user || user.cart.length === 0) {
      return res
        .status(400)
        .json({ message: "No products in cart to place an order" });
    }

    // Find existing order for the user
    let order = await orderModel.findOne({ user: user._id });

    // Prepare cart items
    const newItems = user.cart.map((product) => ({
      product: product._id,
      quantity: 1,
      price: product.price,
    }));

    if (order) {
      // User's order exists, push cart products into existing order's items
      order.items.push(...newItems);

      // Update total amount
      order.totalAmount += newItems.reduce((sum, item) => sum + item.price, 0);

      await order.save();
    } else {
      // No order exists, create a new one
      order = new orderModel({
        user: user._id,
        items: newItems,
        totalAmount: newItems.reduce((sum, item) => sum + item.price, 0),
      });

      await order.save();
    }

    // Empty user cart after order placement
    user.cart = [];
    await user.save();

    req.flash("success", "Order Placed Successfully!");
    return res.redirect("/shop");
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
