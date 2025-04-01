const userModel = require("../models/user-model");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    if (!req.cookies.token) {
      req.flash("error", "You need To login first");
      return res.redirect("/");
    }
    let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
    let user = await userModel
      .findOne({ email: decoded.email })
      .select("-password");
    req.user = user;
    next();
  } catch (err) {
    req.flash("Something Went Wrong");
    return res.redirect("/");
  }
};
