const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  image: {
    type: Buffer,
  },
  name: {
    type: String,
  },
  discount: {
    type: Number,
    default: 0,
  },
  bgcolor: {
    type: String,
  },
  textcolor: {
    type: String,
  },
  price: {
    type: Number,
  },
  panelcolor: {
    type: String,
  },
});

module.exports = mongoose.model("Product", productSchema);
