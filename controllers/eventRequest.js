const User = require("../models/user");
const Event = require("../models/event");
const { sendEventStatusEmail } = require("../utils/mailer");

exports.sendEventRequest = async (req, res) => {
  try {
    const { eventId } = req.body;
    // console.log(eventId);

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(400).json({
        message: "User doesn't exist. Please login first",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({
        message: "This event was deleted",
      });
    }

    const requests = user.requests;

    if (!requests.includes(event._id)) {
      await user.updateOne({
        $push: {
          requests: event._id,
        },
      });

      await event.updateOne({
        $push: {
          requests: user._id,
        },
      });
    }

    await event.save();
    await user.save();

    return res.status(201).json({
      message: "Event request submitted successfully",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error occurred while sending event request" });
  }
};

exports.approveEventRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    //UPDATE STATUS
    const level = 0;
    if (event.category === "day0") {
      level = 1;
    } else if (event.category === "10x") {
      level = 2;
    } else {
      level = 3;
    }
    user.allowed = level;

    await user.updateOne({
      $pull: {
        requests: event._id,
      },
    });
    await event.updateOne({
      $pull: {
        requests: user._id,
      },
    });
    await user.updateOne({
      $push: {
        approved: event._id,
      },
    });
    await event.updateOne({
      $push: {
        approved: user._id,
      },
    });

    // SEND APPROVED EMAIL TO THE USER
    const email = user.email;
    await sendEventStatusEmail(email, "approved");

    await user.save();
    await user.save();

    //SEND RESPONSE
    return res.status(200).json({
      message: "Event request approved successfully",
      eventRequest: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error occurred while approving event request" });
  }
};

exports.rejectEventRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    //UPDATE STATUS
    await event.updateOne({
      $pull: {
        requests: user._id,
      },
    });
    await user.updateOne({
      $pull: {
        requests: event._id,
      },
    });

    // SEND REJECTED EMAIL TO THE USER
    await sendEventStatusEmail(user.email, "rejected");

    await user.save();
    await user.save();

    //SEND RESPONSE
    return res.status(200).json({
      message: "Event request rejected successfully",
      eventRequest: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error occurred while rejecting event request" });
  }
};

exports.getEventRequests = async (req, res) => {
  try {
    const result = await Event.find({}).populate("requests");
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }
    const requests = result.map((event) => event.requests);
    return res.status(200).json({ requests });
  } catch (error) {
    console.error(error);
  }
};

exports.getEventApproved = async (req, res) => {
  try {
    const result = await Event.find({}).populate("approved");
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }
    let approved = [];
    for (let i = 0; i < result.length; i++) {
      const app = result[i].approved;
      approved.push(app);
    }
    return res.status(200).json({ approved });
  } catch (error) {
    console.error(error);
  }
};

exports.getEventAttendees = async (req, res) => {
  try {
    const result = await Event.find({}).populate("attendees");
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }
    let attendees = [];
    for (let i = 0; i < result.length; i++) {
      const app = result[i].attendees;
      attendees.push(app);
    }
    return res.status(200).json({ attendees });
  } catch (error) {
    console.error(error);
  }
};

exports.getEventRequestsByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await Event.findById(eventId).populate("requests");
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    return res.status(200).json(result.requests);
  } catch (error) {
    console.error(error);
  }
};

exports.getEventApprovedByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await Event.findById(eventId).populate("approved");
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    return res.status(200).json(result.approved);
  } catch (error) {
    console.error(error);
  }
};

exports.getEventAttendeesByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await Event.findById(eventId).populate("attendees");
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    return res.status(200).json(result.attendees);
  } catch (error) {
    console.error(error);
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const { userId } = req.user;

    if (!eventId || !userId) {
      return res.status(400).json({
        message: "Error receiving details",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (event.approved.includes(userId)) {
      return res.status(200).json({
        message: "Event already joined",
      });
    }

    await event.updateOne({
      $push: {
        approved: user._id,
      },
    });

    await user.updateOne({
      $push: {
        approved: event._id,
      },
    });
    await user.save();
    await event.save();

    return res.status(200).json({
      message: "User joined the event successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error occurred while joining the event",
    });
  }
};

exports.withdrawRequest = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
    }

    const { userId } = req.user;
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(403).json({
        message: "Event not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({
        message: "User not found",
      });
    }

    if (!user.requests.includes(eventId)) {
      return res.status(404).json({
        message: "Event request not found",
      });
    }

    await user.updateOne({
      $pull: {
        requests: eventId,
      },
    });

    await event.updateOne({
      $pull: {
        requests: eventId,
      },
    });

    await event.save();
    await user.save();

    return res.status(200).json({
      message: "Request withdrew successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while withdrawing the request",
    });
  }
};
