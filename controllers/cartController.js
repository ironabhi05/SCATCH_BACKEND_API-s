const userModel = require("../models/user-model");
const logger = require("../utils/logger");

module.exports.cartItemDelete = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await userModel.findOne({ email: req.user.email });

    if (!user) {
      logger.info(`User not found while deleting cart item: ${req.user.email}`);
      return res.status(404).json({ message: "User not found" });
    }

    const prevCartLength = user.cart.length;
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );
    await user.save();

    logger.info(
      `Removed product ${productId} from cart for user ${req.user.email}. Cart size: ${prevCartLength} -> ${user.cart.length}`
    );

    res
      .status(200)
      .json({ message: "Item removed from cart", cart: user.cart });
  } catch (err) {
    logger.error("Error removing cart item", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

module.exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let user = await userModel.findOne({ email: req.user.email });
    user.cart.push({ product: productId, quantity: quantity });
    await user.save();
    logger.info(
      `Item added to cart: ProductID=${productId}, Quantity=${quantity}, User=${req.user.email}`
    );
    return res.json({ message: "Item Added", cart: user.cart });
  } catch (err) {
    logger.error("Error adding item to cart", {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json(err);
  }
};

module.exports.getAddedItems = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("cart.product");
    logger.info(
      `Cart fetched for user: ${req.user.email}, Items=${user.cart.length}`
    );
    return res.json({ cart: user.cart });
  } catch (err) {
    logger.error("Error fetching cart", {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Failed to get cart data" });
  }
};

