const detectIntent = (message) => {
  message = message.toLowerCase();

  // Greetings
  if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(message)) return "greet";

  // Product price inquiry
  if (/\b(price|cost|how much|what's the price|rate|charges)\b/.test(message)) return "check_price";

  // Product details or description
  if (/\b(details|description|info|information|tell me about|specs|features)\b/.test(message)) return "product_details";

  // Stock or availability
  if (/\b(stock|available|availability|in stock|out of stock|inventory|left)\b/.test(message)) return "check_stock";

  // Forget/reset password
  if (/\b(reset|forget|forgot|password|change password|recover password)\b/.test(message)) return "forget_password";

  // Order status or tracking
  if (/\b(order status|track order|my order|where is my order|order tracking|order update)\b/.test(message)) return "order_status";

  // Add to cart
  if (/\b(add to cart|add this|buy now|purchase|order this|i want to buy|add bag)\b/.test(message)) return "add_to_cart";

  // Remove from cart
  if (/\b(remove from cart|delete from cart|remove item|delete item|cancel item)\b/.test(message)) return "remove_from_cart";

  // View cart
  if (/\b(view cart|show cart|my cart|cart items|what's in my cart)\b/.test(message)) return "view_cart";

  // Checkout
  if (/\b(checkout|proceed to checkout|place order|buy all|complete purchase)\b/.test(message)) return "checkout";

  // List categories
  if (/\b(categories|types of bags|show categories|bag types|what bags do you have)\b/.test(message)) return "list_categories";

  // List offers or discounts
  if (/\b(offers|discounts|sale|deal|any offer|any discount|promo)\b/.test(message)) return "list_offers";

  // Ask about delivery or shipping
  if (/\b(delivery|shipping|when will i get|how long to deliver|delivery time|shipping charges)\b/.test(message)) return "delivery_info";

  // Ask about returns or refund
  if (/\b(return|refund|exchange|return policy|refund policy|can i return)\b/.test(message)) return "return_policy";

  // Contact support/help
  if (/\b(help|support|contact|customer care|assist|problem|issue)\b/.test(message)) return "contact_support";

  // User registration or sign up
  if (/\b(register|sign up|create account|new user|join)\b/.test(message)) return "register";

  // User login
  if (/\b(login|log in|sign in|access account)\b/.test(message)) return "login";

  // User logout
  if (/\b(logout|log out|sign out|exit account)\b/.test(message)) return "logout";

  // Product search
  if (/\b(search|find|looking for|show me|do you have|find bag|search bag)\b/.test(message)) return "search_product";

  return "unknown";
};

module.exports = detectIntent;
