const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  // verifyUser,
  updateUser,
  forgotPassword,
  resetPassword,
  loginAdmin,
  details,
  fetchUser,
  sendOtp,
  fetchDetails,
  googleLogin,
  googleCallback,
  googleAuth,
} = require("../controllers/auth");
const { isAuth } = require("../middlewares/isAuth");
const { request } = require("../middlewares/request");
const { isAdmin } = require("../middlewares/isAdmin");
//will be used afterwards
//router.post ("register", isAccepted, registerUser);

router.post("/register", registerUser);
router.post("/login", loginUser);
// router.post("/verify", verifyUser);
router.post("/send-otp", sendOtp);
router.post("/update", isAuth, updateUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login-admin", loginAdmin);
router.post("/submit-details", request, details);
router.get("/me", isAuth, fetchUser);
router.get("/show/:id", isAdmin, fetchDetails);

// Server-side OAuth flow routes

router.get("/google", googleAuth);

module.exports = router;
