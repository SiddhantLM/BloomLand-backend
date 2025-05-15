const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const OTP = require("../models/otp");
const User = require("../models/user");
const { oauth2Client } = require("../utils/googleLogin");
const axios = require("axios");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const { sendOtpEmail, sendResetPasswordEmail } = require("../utils/mailer");

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.registerUser = async (req, res) => {
  try {
    const { email, password, role = "user", otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(401).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const otpEntry = await OTP.findOne({ email: email });
    if (!otpEntry) {
      return res.status(401).json({ message: "No OTP found for this user" });
    }

    if (otpEntry.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const now = new Date();
    if (new Date(otpEntry.expiresIn) < now) {
      return res.status(401).json({ message: "OTP has expired" });
    }
    // let user = null;

    const result = await User.create({
      email: email,
      password: hashedPassword,
      role: role,
    });

    const token = jwt.sign(
      {
        userId: result._id,
        role: result.role,
        details: result.detailsSubmitted,
        level: result.allowed,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      }
    );

    await otpEntry.deleteOne();
    await result.save();

    return res.status(201).json({
      message: "User registered successfully",
      token: token,
      detailsSubmitted: result.detailsSubmitted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = null;

    const result = await User.findOne({ email: email });
    if (!result) {
      return res.status(401).json({ message: "Invalid email" });
    }
    user = result;

    //CHECK IF THE PASSWORD IS VALID

    if (!user.password) {
      return res.status(401).json({ message: "You logged in with google" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // GENERATE JWT TOKEN
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        details: user.detailsSubmitted,
        level: user.allowed,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      }
    );

    // RETURN RESPONSE
    return res.json({
      message: "User logged in successfully",
      token,
      detailsSubmitted: user.detailsSubmitted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresIn = Date.now() + 10 * 60 * 1000;

    const existingOtp = await OTP.findOne({ email: email });

    let otp = null;
    if (!existingOtp) {
      otp = await OTP.create({
        email: email,
        expiresIn: expiresIn,
        otp: newOtp,
      });
      await otp.save();
    } else {
      otp = await OTP.findOneAndUpdate(
        { email: email },
        {
          otp: newOtp,
          expiresIn: expiresIn,
        },
        { new: true }
      );
    }

    if (!otp) {
      return res.status(401).json({
        message: "error updating OTP",
      });
    }

    await sendOtpEmail(email, newOtp);

    return res.status(200).json({
      message: "OTP send successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while sending OTP",
    });
  }
};

// exports.verifyUser = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ message: "Email is required" });

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

//     // Check if OTP already exists
//     const checkQuery = "SELECT * FROM otp_verifications WHERE email = $1";
//     const checkValues = [email];
//     let existing = null;
//     try {
//       existing = await client.query(checkQuery, checkValues);
//     } catch (error) {
//       console.error("Error checking OTP existence", error);
//       return res.status(500).json({ message: "Error occurred" });
//     }

//     if (existing && existing.rows.length > 0) {
//       // Update existing OTP
//       const updateQuery = `
//           UPDATE otp_verifications
//           SET otp = $1, expires_at = $2, created_at = CURRENT_TIMESTAMP
//           WHERE email = $3
//           RETURNING *;
//         `;
//       const updateValues = [otp, expiresAt, email];
//       await client.query(updateQuery, updateValues);
//     } else {
//       // Insert new OTP record
//       const insertQuery = `
//           INSERT INTO otp_verifications (email, otp, expires_at)
//           VALUES ($1, $2, $3)
//           RETURNING *;
//         `;
//       const insertValues = [email, otp, expiresAt];
//       await client.query(insertQuery, insertValues);
//     }

//     // Send OTP to the user's email address
//     const mailSent = await sendOtpEmail(email, otp);
//     if (!mailSent) {
//       return res
//         .status(500)
//         .json({ message: "OTP generated, but email failed to send" });
//     }

//     // Return the sent OTP
//     return res.status(200).json({ message: "OTP sent successfully", otp });
//   } catch (error) {
//     console.error("Error in verifyUser:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

exports.updateUser = async (req, res) => {
  try {
    const { name, dob, phone } = req.body;
    if (!name || !dob || !phone) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const id = req.user.userId;
    if (!id) {
      return res.status(400).json({
        message: "ID is required",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found!",
      });
    }

    await user.updateOne({
      name: name,
      dob: dob,
      phone: phone,
    });

    return res.status(200).json({
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      return res.status(401).json({
        message: "Email doesn't exist",
      });
    }

    const token = jwt.sign(
      { email: existingUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    const url = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`;
    // Send OTP to the user's email address
    const mailSent = await sendResetPasswordEmail(email, url);
    if (!mailSent) {
      return res
        .status(500)
        .json({ message: "OTP generated, but email failed to send" });
    }

    // Return the sent OTP
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in verifyUser:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    if (!email) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(400).json({
        message: "This email doesn't exist",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    await user.save();

    const newToken = jwt.sign({
      userId: user._id,
      role: user.role,
      details: user.detailsSubmitted,
      level: user.allowed,
    });

    return res.status(200).json({
      message: "Password changed successfully",
      token: newToken,
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      }
    );

    return res.json({
      message: "Admin logged in successfully",
      token,
    });
  } catch (error) {
    console.error("Error in loginAdmin:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.details = async (req, res) => {
  try {
    const {
      name,
      dob,
      mobile,
      journey,
      experience,
      reason,
      area,
      state,
      bloom,
      ready,
      notes,
    } = req.body;
    if (
      !name ||
      !dob ||
      !mobile ||
      !journey ||
      !experience ||
      !reason ||
      !area ||
      !state ||
      !bloom ||
      !ready
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({
        message: "Email not found",
      });
    }

    await user.updateOne({
      name: name,
      dob: dob,
      phone: mobile,
      journey: journey,
      experience: experience,
      reason: reason,
      area: area,
      state: state,
      bloom: bloom,
      ready: ready,
    });
    if (notes) {
      await user.updateOne({
        notes: notes,
      });
    }
    await user.updateOne({
      detailsSubmitted: true,
    });
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        details: user.detailsSubmitted,
        level: user.allowed,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      }
    );

    return res.status(200).json({
      message: "Details updated successfully",
      token: token,
      detailsSubmitted: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while updating details",
    });
  }
};

//USER FETCHING
exports.fetchUser = async (req, res) => {
  try {
    const id = req.user.userId;
    if (!id) {
      return res.status(401).json({
        message: "Access denied",
      });
    }

    const user = await User.findById(id)
      .populate("requests")
      .populate("joined")
      .populate("approved");
    if (!user) {
      return res.status(401).json({
        message: "Access denied",
      });
    }
    const data = {
      name: user.name,
      phone: user.phone,
      email: user.email,
      allowed: user.allowed,
      requests: user.requests,
      joined: user.joined,
      approved: user.approved,
      dob: user.dob,
      experience: user.experience,
      journey: user.journey,
      reason: user.reason,
      area: user.area,
      bloom: user.bloom,
      ready: user.ready,
      state: user.state,
      notes: user.notes,
      isCommunity: user.isCommunity,
    };

    return res.status(200).json({
      message: "Fetched user successfully",
      user: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Access denied",
    });
  }
};

exports.fetchDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "requests approved joined"
    );
    if (!user) {
      return res.status(400).json({
        message: "Unavle to fetch user",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while fetching the",
    });
  }
};

//GOOGLE AUTHENTICATION
exports.googleAuth = async (req, res, next) => {
  const code = req.query.code;
  try {
    const googleRes = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    const { email, id } = userRes.data;
    // console.log(userRes);
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        googleId: id,
      });
    }
    const { _id } = user;
    const token = jwt.sign(
      {
        userId: _id,
        role: user.role,
        details: user.detailsSubmitted,
        level: user.allowed,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      }
    );
    res.status(200).json({
      message: "success",
      token,
      detailsSubmitted: user.detailsSubmitted,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
