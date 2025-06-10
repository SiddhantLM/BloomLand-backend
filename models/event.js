const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  poster: {
    type: String,
    // required:true
  },
  images: [
    {
      type: String,
      // required:true
    },
  ],
  category: {
    type: String,
    required: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
  },
  price: {
    type: Number,
  },
  subtitle: {
    type: String,
  },
  location: {
    city: {
      type: String,
      // required: true,
    },
    state: {
      type: String,
      // required: true,
    },
    country: {
      type: String,
      // required: true,
    },
  },
  address: {
    venue: {
      type: String,
    },
    landmark: {
      type: String,
    },
    area: {
      type: String,
    },
  },
  includes: [
    {
      id: {
        type: Number,
      },
      heading: {
        type: String,
      },
      value: {
        type: String,
      },
    },
  ],
  itinerary: [
    {
      id: {
        type: Number,
      },
      date: {
        type: Date,
      },
      title: {
        type: String,
      },
      activities: [
        {
          id: {
            type: Number,
          },
          time: {
            type: String,
          },
          description: {
            type: String,
          },
          location: {
            type: String,
          },
        },
      ],
    },
  ],
  duration: {
    type: String,
  },
  scheduled: {
    type: Boolean,
    default: false,
  },
  scheduledFor: {
    type: Date,
  },
  visibility: {
    type: String,
    default: "private",
    enum: ["private", "public"],
  },
  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
    },
  ],
  approved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Approved",
    },
  ],
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Joined",
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

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
