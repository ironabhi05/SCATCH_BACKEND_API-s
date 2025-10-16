const jwt = require("jsonwebtoken");

const generateResetToken = (user) => {
    return jwt.sign(
        { id: user._id, purpose: "reset_password" },
        process.env.JWT_KEY,
        { expiresIn: "20m" }
    );
}

module.exports = { generateResetToken };
