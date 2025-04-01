const jwt = require('jsonwebtoken');

const generateToken = (owner) => {
    return jwt.sign({ email: owner.email, id: owner._id }, process.env.JWT_KEY)
};

module.exports.generateToken = generateToken;