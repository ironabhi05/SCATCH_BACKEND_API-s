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
router.post(
  "/create",
  upload.array("images", 4), // handle uploaded files (if any)
  async (req, res) => {
    try {
      let {
        name,
        discount,
        description,
        size,
        price,
        material,
        height,
        length,
        width,
        category,
      } = req.body;

      let imageUrls = [];

      // If images are uploaded via files
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "auto" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );
            stream.end(file.buffer);
          });
        });

        imageUrls = await Promise.all(uploadPromises);
      }

      // If image URLs are passed directly in the body
      else if (req.body.image) {
        if (Array.isArray(req.body.image)) {
          imageUrls = req.body.image;
        } else {
          try {
            const urls = JSON.parse(req.body.image);
            if (Array.isArray(urls)) {
              imageUrls = urls;
            } else {
              return res
                .status(400)
                .json({ error: "Image must be an array of URLs" });
            }
          } catch (err) {
            return res.status(400).json({ error: "Invalid image URL format" });
          }
        }
      }

      // Default image if no images passed
      if (imageUrls.length === 0) {
        imageUrls.push("https://your-default-image-url.com/default-image.png");
      }

      if (size && typeof size === "string") {
        size = {
          type: size,
          height: Number(height),
          width: Number(width),
          length: Number(length),
        };
      }


      const product = await productModel.create({
        name,
        price,
        discount,
        description,
        material,
        size,
        category,
        image: imageUrls,
      });

      return res
        .status(200)
        .json({ message: "Product added successfully", product });
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);


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
