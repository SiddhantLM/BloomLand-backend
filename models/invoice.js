const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
  },
  payment_id: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product_type: {
    type: String,
    enum: ["Event", "Community"],
    required: true,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "product_type",
    required: true,
  },

  created_at: {
    type: Date,
    default: Date.now(),
  },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
