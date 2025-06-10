const User = require("../models/user");
const Event = require("../models/event");
const Request = require("../models/request");
const Approved = require("../models/approved");
const { sendEventStatusEmail } = require("../utils/mailer");
const Joined = require("../models/joined");

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

    const existingRequest = await Request.findOne({
      userId: user._id,
      eventId: event._id,
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "You have already sent a request to this event",
      });
    }

    const request = await Request.create({
      userId: user._id,
      eventId: event._id,
    });
    await request.save();

    await user.updateOne({
      $push: {
        requests: request._id,
      },
    });

    await event.updateOne({
      $push: {
        requests: request._id,
      },
    });

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

    //MAKE REQUEST ACCEPTED
    const request = await Request.findOneAndUpdate(
      {
        userId: user._id,
        eventId: event._id,
      },
      {
        $set: {
          status: "accepted",
        },
      },
      { new: true }
    );

    const approved = await Approved.create({
      userId: user._id,
      eventId: event._id,
    });

    await user.updateOne({
      $push: {
        approved: approved._id,
      },
    });
    await event.updateOne({
      $push: {
        approved: approved._id,
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
    const request = await Request.findOneAndUpdate(
      {
        userId: user._id,
        eventId: event._id,
      },
      {
        $set: {
          status: "rejected",
        },
      },
      { new: true }
    );

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
    const requests = await Request.find({}).populate("eventId userId");
    if (!requests) {
      return res.status(400).json({
        message: "Event Requests not found",
      });
    }
    return res.status(200).json({ requests });
  } catch (error) {
    console.error(error);
  }
};

exports.getEventApproved = async (req, res) => {
  try {
    const result = await Approved.find({}).populate("eventId userId");
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }
    return res.status(200).json({ approved: result });
  } catch (error) {
    console.error(error);
  }
};

exports.getEventAttendees = async (req, res) => {
  try {
    const result = await Joined.find({}).populate("userId eventId");
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }
    return res.status(200).json({ attendees: result });
  } catch (error) {
    console.error(error);
  }
};

exports.getEventRequestsByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await Request.find({ eventId: eventId }).populate(
      "userId eventId"
    );
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
  }
};

exports.getEventApprovedByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await Approved.find({ eventId: eventId }).populate(
      "userId eventId"
    );
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
  }
};

exports.getEventAttendeesByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await Joined.find({ eventId: eventId }).populate(
      "userId eventId"
    );
    if (!result) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    return res.status(200).json(result);
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

    const existingRequest = await Request.findOne({
      userId: userId,
      eventId: eventId,
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "You have already requested for this event",
      });
    }

    const request = await Request.create({
      userId: user._id,
      eventId: event._id,
      status: "accepted",
    });

    await event.updateOne({
      $push: {
        requests: request._id,
      },
    });
    await user.updateOne({
      $push: {
        requests: request._id,
      },
    });

    const approved = await Approved.create({
      userId: user._id,
      eventId: event._id,
    });

    await event.updateOne({
      $push: {
        approved: approved._id,
      },
    });

    await user.updateOne({
      $push: {
        approved: approved._id,
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

    const existingRequest = await Request.findOne({
      userId: userId,
      eventId: eventId,
    });
    if (!existingRequest) {
      return res.status(403).json({
        message: "No pending request found",
      });
    }

    existingRequest.status = "withdrawn";

    await user.updateOne({
      $pull: {
        requests: existingRequest._id,
      },
    });

    await event.updateOne({
      $pull: {
        requests: existingRequest._id,
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
