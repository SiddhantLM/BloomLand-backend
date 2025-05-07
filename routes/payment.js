const express = require("express");
const router = express.Router();

const {
  capturePayment,
  verifyPayment,
  sendPaymentSuccessEmail,
} = require("../controllers/payment");
const { isAuth } = require("../middlewares/isAuth");

router.post("/capturePayment", isAuth, capturePayment);
router.post("/verifyPayment", isAuth, verifyPayment);
router.post("/sendPaymentSuccessEmail", isAuth, sendPaymentSuccessEmail);

module.exports = router;
