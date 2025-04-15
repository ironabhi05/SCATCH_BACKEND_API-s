const jwt = require("jsonwebtoken");
const generateAdminToken = (owner) => {
  return jwt.sign(
    { adminId: owner._id, email: owner.email, role: "admin" },
    process.env.JWT_ADMIN_KEY,
    { expiresIn: "2h" }
  );
};
module.exports = { generateAdminToken };
