const { instance } = require("../config/razorpay");
const crypto = require("crypto");
const User = require("../models/user");
const Event = require("../models/event");
const { default: mongoose } = require("mongoose");
const { sendPaymentSuccessfulEmail } = require("../utils/mailer");
const Invoice = require("../models/invoice");
const Approved = require("../models/approved");
const Request = require("../models/request");
const Joined = require("../models/joined");

exports.capturePayment = async (req, res) => {
  try {
    const { eventId } = req.body;
    const { userId } = req.user;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    const uid = new mongoose.Types.ObjectId(userId);
    if (event.attendees.includes(uid)) {
      return res.status(400).json({
        message: "User already joined this event",
      });
    }

    const options = {
      amount: event.price * 100,
      currency: "INR",
      receipt: Math.random(Date.now()).toString(),
    };

    try {
      // Initiate the payment using Razorpay
      const paymentResponse = await instance.orders.create(options);
      res.json({
        success: true,
        data: paymentResponse,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Could not initiate order." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while creating payment",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const eventId = req.body?.eventId;
    const { amount, productType = "Event" } = req.body;
    const { userId } = req.user;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !eventId ||
      !userId ||
      !amount
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      await enrollUser(eventId, userId, res);
      const invoice = await Invoice.create({
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        user_id: userId,
        product_type: productType,
        product_id: eventId,
        amount: amount,
      });
      await invoice.save();
      return res.status(200).json({
        message: "Event joined successfully",
        invoice,
      });
    }
    return res.status(500).json({
      message: "Couldn't join event",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while verifying payment",
    });
  }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  try {
    const { eventId, orderId, paymentId, amount } = req.body;

    const { userId } = req.user;

    if (!orderId || !paymentId || !amount || !userId || !eventId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all the details" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    await sendPaymentSuccessfulEmail(
      user.email,
      event,
      orderId,
      paymentId,
      amount
    );

    return res.status(200).json({
      message: "Mail sent successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while sending success email",
    });
  }
};

const enrollUser = async (eventId, userId, res) => {
  try {
    const approved = await Approved.findOne({
      userId: userId,
      eventId: eventId,
    });
    if (!approved) {
      return res.status(403).json({
        message: "You have to be accepted for the event first",
      });
    }
    const event = await Event.findByIdAndUpdate(eventId).populate("approved");
    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    await approved.updateOne({ $set: { status: "paid" } });

    const joined = await Joined.create({
      userId: userId,
      eventId: eventId,
    });
    const enrolledEvent = await Event.findOneAndUpdate(
      { _id: eventId },
      { $push: { attendees: joined._id } },
      { new: true }
    );

    if (!enrolledEvent) {
      return res.status(500).json({ success: false, error: "Event not found" });
    }

    const enrolledUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          joined: joined._id,
        },
      },
      { new: true }
    );

    if (!enrolledUser) {
      return res.status(500).json({ success: false, error: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while enrolling",
    });
  }
};
