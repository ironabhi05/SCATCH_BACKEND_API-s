const ownerModel = require("../models/owner-model");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    if (!req.cookies.token) {
      req.flash("error", "You need To login first");
      return res.redirect("/api/owners/admin/login");
    }
    let decoded = jwt.verify(req.cookies.token, process.env.JWT_ADMIN_KEY);
    let admin = await ownerModel
      .findOne({ email: decoded.email })
      .select("-password");
    req.admin = admin;
    next();
  } catch (err) {
    req.flash("Something Went Wrong");
    return res.redirect("/api/owners/admin/login");
  }
};
