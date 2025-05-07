const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ["inquiry", "auth", "event"],
  },
  images: [
    {
      type: String,
    },
  ],
  description: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "resolved", "in-touch"],
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  updated_at: {
    type: Date,
    default: Date.now(),
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
