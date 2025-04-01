const mongoose = require("mongoose");

const ownerSchema = mongoose.Schema({
  fullname: {
    type: String,
    minLength: 3,
    trim: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  picture: {
    type: String,
  },
});

module.exports = mongoose.model("Owner", ownerSchema);
