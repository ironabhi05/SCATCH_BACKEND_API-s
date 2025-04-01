const ownerModel = require("../models/owner-model");
const bcrypt = require("bcrypt");
const { generateAdminToken } = require("../utils/generateAdminToken");

module.exports.createOwner = async (req, res) => {
  try {
    let owner = await ownerModel.find();
    if (owner.length > 0) {
      return res.status(401).json({ message: "Sorry you can't create owner" });
    }
    let { fullname, password, email } = req.body;
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          return res.status(500).send(err.message);
        }
        let newOwner = await ownerModel.create({
          fullname,
          password: hash,
          email,
        });
        let token = generateAdminToken(newOwner);
        res.cookie("token", token);
        return res.status(200).send(newOwner);
      });
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.adminLogin = async (req, res) => {
  let { email, password } = req.body;
  let isAdmin = await ownerModel.findOne({ email: email });
  if (!isAdmin) {
    req.flash("error", "Email or Password Incorrect");
    return res.status(400).json({ message: "Email or Password Incorrect" });
  }
  bcrypt.compare(password, isAdmin.password, (err, result) => {
    if (result) {
      let token = generateAdminToken(isAdmin);
      req.flash("success", "Welcome Admin");
      res.cookie("token", token);
      req.session.loggedin = true;
      req.session.adminLoggedin = true;
      return res.redirect("/api/owners/admin/panel");
    } else {
      req.flash("error", "Email or Password incorrect");
      return res.redirect("/api/owners/admin/login");
    }
  });
};
