const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  expiresIn: {
    type: Date,
    default: Date.now() + 1000 * 60 * 10,
  },
  otp: {
    type: String,
    required: true,
  },
});

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
