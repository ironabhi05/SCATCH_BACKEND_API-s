const express = require("express");
const router = express.Router();
const Product = require("../models/product-model");
const detectIntent = require("../utils/intentDetection");

// POST /api/chat
router.post("/chat", async (req, res) => {
  const { message } = req.body;
  const intent = detectIntent(message);

  try {
    if (intent === "greet") {
      return res.json({
        reply: "Hi this is Scatchy! 👋 Welcome to SCATCH MART. How can I assist you today? You can ask about products, prices, offers, or anything else!",
      });
    }

    // Password reset intent (intentDetection uses "forget_password")
    if (intent === "forget_password") {
      return res.json({
        reply: "No worries! If you forgot your password, just click on 'Forgot Password' on the login page. We'll help you reset it in a few easy steps.",
      });
    }

    // Product name extraction for relevant intents
    const productNameMatch = message.match(/(?:of|for|about)\s+([a-zA-Z0-9\s\-]+)/i);
    const productName = productNameMatch ? productNameMatch[1].trim() : null;

    // If product name is required but missing
    if (
      !productName &&
      ["check_price", "product_details", "check_stock"].includes(intent)
    ) {
      return res.json({ reply: "Could you please tell me the product name you're interested in?" });
    }

    // Only call $regex if productName exists
    let product = null;
    if (productName) {
      product = await Product.findOne({
        name: { $regex: productName, $options: "i" },
      });
    }

    if (
      !product &&
      ["check_price", "product_details", "check_stock"].includes(intent)
    ) {
      return res.json({
        reply: `Sorry, I couldn't find "${productName}" in our store. Please check the product name or try searching for another item.`,
      });
    }

    if (intent === "check_price") {
      return res.json({
        reply: `The price of "${product.name}" is ₹${product.price}. Would you like to know more about this product or add it to your cart?`,
      });
    }

    if (intent === "product_details") {
      return res.json({
        reply: `Here are the details for "${product.name}":\n- Category: ${product.category}\n- Material: ${product.material}\n- Description: ${product.description}\n- Size: ${product.size.type} (${product.size.length} x ${product.size.width} x ${product.size.height} cm)\n- Price: ₹${product.price}\nLet me know if you want to know more or see similar products!`,
      });
    }

    if (intent === "check_stock") {
      return res.json({ reply: `Yes, "${product.name}" is currently available! Would you like to add it to your cart?` });
    }

    if (intent === "list_categories") {
      return res.json({
        reply: "We offer a variety of bags: Suitcases & Trolley Bags, Duffle Bags, Backpacks, School Bags, Handbags, and Laptop Bags. Which category are you interested in?",
      });
    }

    if (intent === "list_offers") {
      return res.json({
        reply: "Great news! We have exciting discounts and offers running. Most products have at least 10% off. Would you like to see the best deals?",
      });
    }

    if (intent === "delivery_info") {
      return res.json({
        reply: "We offer fast and reliable delivery across India. Most orders are delivered within 3-7 business days. Shipping charges may apply based on your location and order value.",
      });
    }

    if (intent === "return_policy") {
      return res.json({
        reply: "You can return or exchange most products within 7 days of delivery. For more details, please check our Return & Refund Policy page or ask me for help.",
      });
    }

    if (intent === "contact_support") {
      return res.json({
        reply: "If you need any help, you can contact our support team at support@scatchmart.com or call us at 1800-123-4567. I'm also here to assist you!",
      });
    }

    if (intent === "add_to_cart") {
      return res.json({
        reply: "To add a product to your cart, just tell me the product name and quantity. For example: 'Add 2 Duffle Bags to my cart.'",
      });
    }

    if (intent === "remove_from_cart") {
      return res.json({
        reply: "To remove an item from your cart, please tell me the product name. For example: 'Remove Backpack from my cart.'",
      });
    }

    if (intent === "view_cart") {
      return res.json({
        reply: "To view your cart, please go to the cart page or type 'Show my cart'.",
      });
    }

    if (intent === "checkout") {
      return res.json({
        reply: "Ready to checkout? Please visit your cart and click on 'Proceed to Checkout'. Let me know if you need help with the process!",
      });
    }

    if (intent === "register") {
      return res.json({
        reply: "To create a new account, click on 'Sign Up' at the top right corner and fill in your details. Welcome to the SCATCH MART family!",
      });
    }

    if (intent === "login") {
      return res.json({
        reply: "To log in, click on 'Login' at the top right and enter your email and password. If you forgot your password, just click on 'Forgot Password'.",
      });
    }

    if (intent === "logout") {
      return res.json({
        reply: "You have been logged out. We hope to see you again soon!",
      });
    }

    if (intent === "search_product") {
      return res.json({
        reply: "Please tell me the product or type of bag you're looking for, and I'll help you find it!",
      });
    }

    // Fallback for unknown or unsupported queries
    return res.json({
      reply: "I'm here to help with anything related to SCATCH MART products, orders, and support. Please rephrase your question or ask about our products, offers, or services!",
    });
  } catch (err) {
    return res.json({ reply: "Sorry, something went wrong. Please try again later." });
  }
});

module.exports = router;
