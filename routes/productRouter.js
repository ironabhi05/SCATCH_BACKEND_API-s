const express = require("express");
const router = express.Router();
const upload = require("../utils/multer-Config");
const cloudinary = require("cloudinary").v2;
const productModel = require("../models/product-model");
const isAdminLoggedIn = require("../middleware/isAdminLoggedIn");
const logger = require("../utils/logger");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST route to create a new product
router.post(
  "/create",
  isAdminLoggedIn,  
  upload.array("images", 4), // handle uploaded files (if any)
  async (req, res) => {
    try {
      logger.info(`Create product API hit by admin: ${req.admin?.email || "unknown"}`);

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
        logger.info(`Uploading ${req.files.length} images to Cloudinary`);
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "auto" },
              (error, result) => {
                if (error) {
                  logger.error("Error uploading image to Cloudinary", { error });
                  reject(error);
                } else {
                  logger.info(`Image uploaded successfully: ${result.secure_url}`);
                  resolve(result.secure_url);
                }
              }
            );
            stream.end(file.buffer);
          });
        });

        imageUrls = await Promise.all(uploadPromises);
      }

      // If image URLs are passed directly in the body
      else if (req.body.image) {
        logger.info("Images received via request body");
        if (Array.isArray(req.body.image)) {
          imageUrls = req.body.image;
        } else {
          try {
            const urls = JSON.parse(req.body.image);
            if (Array.isArray(urls)) {
              imageUrls = urls;
            } else {
              logger.error("Image URL is not an array");
              return res
                .status(400)
                .json({ error: "Image must be an array of URLs" });
            }
          } catch (err) {
            logger.error("Invalid image URL format", { error: err });
            return res.status(400).json({ error: "Invalid image URL format" });
          }
        }
      }

      // Default image if no images passed
      if (imageUrls.length === 0) {
        logger.info("No images provided, using default image");
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

      logger.info(`Product created successfully: ${product._id} - ${product.name}`);
      return res
        .status(200)
        .json({ message: "Product added successfully", product });
    } catch (err) {
      logger.error("Error creating product", { error: err });
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
