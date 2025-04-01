const express = require("express");
const router = express.Router();
const upload = require("../utils/multer-Config");
const productModel = require("../models/product-model");
const isAdminLoggedIn = require("../middleware/isAdminLoggedIn");

router.post(
  "/create",
  isAdminLoggedIn,
  upload.single("image"),
  async (req, res) => {
    try {
      let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
      let product = await productModel.create({
        image: req.file.buffer,
        name,
        price,
        discount,
        bgcolor,
        panelcolor,
        textcolor,
      });
      let success = req.flash("success", "Product added");
      return res.redirect("/products/create",success);
    } catch (err) {
      return res.status(500).send("Internal Server Error");
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
    console.error("Error fetching create page data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


module.exports = router;
