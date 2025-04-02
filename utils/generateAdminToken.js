const jwt = require("jsonwebtoken");

const generateAdminToken = (owner) => {
  return jwt.sign(
    { email: owner.email, id: owner._id, role: "admin" }, // Added role field
    process.env.JWT_ADMIN_KEY,
    { expiresIn: "2h" } // Token expires in 2 hours
  );
};

module.exports = { generateAdminToken };
