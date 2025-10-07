const bcrypt = require("bcrypt");
const OTP_LENGTH = 6;

const generateOTP = async (user) => {
  // Generate a OTP of the specified length
  const otp = Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 ** OTP_LENGTH).toString();

  // Hash the OTP
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Store the hashed OTP in the user model
  user.resetOtp = hashedOtp;
  user.resetOtpExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes
  await user.save();

  return otp;
};

module.exports = { generateOTP };
