const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    minLength: 3,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minLength: 6, 
  },
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  contact: {
    type: String,
    match: [/^\d{10}$/, "Contact number must be 10 digits"], 
  },
  picture: {
    type: String,
  },
}, { timestamps: true }); 

module.exports = mongoose.model("User", userSchema);
