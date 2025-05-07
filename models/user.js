const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    // required: true,
  },
  googleId: {
    type: String,
    sparse: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  name: {
    type: String,
  },
  phone: {
    type: String,
  },
  dob: {
    type: Date,
  },
  journey: [
    {
      type: String,
    },
  ],
  experience: [
    {
      type: String,
    },
  ],
  reason: [
    {
      type: String,
    },
  ],
  area: [
    {
      type: String,
    },
  ],
  state: {
    type: String,
  },
  bloom: [
    {
      type: String,
    },
  ],
  ready: {
    type: String,
  },
  notes: {
    type: String,
  },
  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],
  approved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],
  allowed: {
    type: Number,
    default: 0,
  },
  detailsSubmitted: {
    type: Boolean,
    default: false,
  },
  joined: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
