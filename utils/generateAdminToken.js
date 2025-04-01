const jwt = require('jsonwebtoken');

const generateAdminToken = (owner) => {
    return jwt.sign({ email: owner.email, id: owner._id }, process.env.JWT_ADMIN_KEY)
};

module.exports.generateAdminToken = generateAdminToken;