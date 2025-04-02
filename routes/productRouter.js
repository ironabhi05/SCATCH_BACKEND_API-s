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
    let { name, discount, description, size, price, material, image } =
      req.body;

    let imageUrl = ""; // Initialize imageUrl

    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url); // This stores the Cloudinary URL
            }
          }
        );
        stream.end(req.file.buffer);
      });
    } else if (req.body.image) {
      // use image url from req.body.image
      imageUrl = req.body.image;
    } else {
      imageUrl = "https://your-default-image-url.com/default-image.png"; // ✅ Use a valid image URL instead of Base64
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
