const express = require("express");
const router = express.Router();
const upload = require("../utils/multer-Config");
const cloudinary = require("cloudinary").v2;
const productModel = require("../models/product-model");
const isAdminLoggedIn = require("../middleware/isAdminLoggedIn");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST route to create a new product
router.post("/create", upload.single("image"), async (req, res) => {
  try {
    let { name, discount, description, size, price, material } = req.body;

    let imageUrl = ""; // Initialize imageUrl

    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        stream.end(req.file.buffer); // Send buffer to Cloudinary
      });
    } else {
      imageUrl =
        "data:image/png;base64,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"; // Set a default image URL if needed
    }

    // Create product in the database
    const product = await productModel.create({
      name,
      price,
      discount,
      description,
      material,
      size,
      image: imageUrl, // Store the Cloudinary URL
    });

    return res
      .status(200)
      .json({ message: "Product added successfully", product });
  } catch (err) {
    console.error("Error:", err); // This will log the actual error
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/create", isAdminLoggedIn, (req, res) => {
  try {
    let success = req.flash("success");
    const loggedin = req.session.loggedin || false;

    // Return the data as a JSON response
    return res.json({
      success: success,
      loggedin: loggedin,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
