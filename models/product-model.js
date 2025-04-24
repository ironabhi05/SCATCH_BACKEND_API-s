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
  image: [
    {
      type: String,
      required: true,
    },
  ],
  name: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    default: 10,
  },
  description: {
    type: String,
    required: true,
  },
  size: {
    type: sizeSchema,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: [
      "Suitcases & Trolley Bags",
      "Duffle Bags",
      "Backpacks",
      "School Bags",
      "Handbags",
      "Laptop Bags",
    ],
    default: "Backpacks",
  },
  material: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Product", productSchema);
