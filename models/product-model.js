const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Small", "Medium", "Large", "Free Size"],
    required: true,
  },
  length: {
    type: Number,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
});

const productSchema = new mongoose.Schema({
  image: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
  },
  size: {
    type: sizeSchema, // Using the nested schema
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  material: {
    type: String,
  },
});

module.exports = mongoose.model("Product", productSchema);
