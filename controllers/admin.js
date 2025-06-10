const User = require("../models/user");
const Event = require("../models/event");
const Request = require("../models/request");
const Approved = require("../models/approved");
const Joined = require("../models/joined");
const { sendEventStatusEmail } = require("../utils/mailer");

exports.approveAll = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("requests");
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }
    const requests = user.requests;
    let maxi = user.allowed;
    for (let i = 0; i < requests.length; i++) {
      const currReq = await Request.findById(requests[i]).populate("eventId");
      if (!currReq) {
        return res.status(404).json({
          message: "Request not found",
        });
      }

      if (currReq.status !== "pending") {
        continue;
      }

      if (currReq.eventId.category === "day0") {
        if (maxi < 1) {
          maxi = 1;
        }
      } else if (currReq.eventId.category === "10x") {
        if (maxi < 2) {
          maxi = 2;
        }
      } else if (currReq.eventId.category === "100x") {
        if (maxi < 3) {
          maxi = 3;
        }
      }

      currReq.status = "accepted";

      const eve = await Event.findById(currReq.eventId);
      if (!eve) {
        return res.status(404).json({
          message: "Event not found",
        });
      }

      const approved = await Approved.create({
        userId: user._id,
        eventId: eve._id,
      });

      await user.updateOne({
        $push: {
          approved: approved._id,
        },
      });
      await eve.updateOne({
        $push: {
          approved: approved._id,
        },
      });
      await eve.save();
      await user.save();
      await currReq.save();
    }
    user.allowed = maxi;
    await user.save();

    await sendEventStatusEmail(user.email, "approved");

    return res.status(200).json({
      message: "All requests approved successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Requests couldn't be approved",
    });
  }
};

exports.rejectAll = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const requests = user.requests;
    for (let i = 0; i < requests.length; i++) {
      const currReq = await Request.findById(requests[i]);
      if (!currReq) {
        return res.status(404).json({
          message: "Request not found",
        });
      }

      if (currReq.status !== "pending") {
        continue;
      }

      currReq.status = "rejected";
      await currReq.save();
    }
    user.allowed = maxi;
    await user.save();

    user.allowed = 0;
    await user.save();

    await sendEventStatusEmail(user.email, "rejected");

    return res.status(200).json({
      message: "All requests rejected successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while rejecting requests",
    });
  }
};

exports.approveDay0 = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("requests");
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    user.allowed = 1;
    const userRequests = user.requests;
    for (let request of userRequests) {
      const currReq = await Request.findById(request._id).populate("eventId");
      if (!currReq) {
        continue;
      }

      if (currReq.eventId.category === "day0" && currReq.status === "pending") {
        //APPROVE THIS REQUEST
        currReq.status = "accepted";
        const approve = await Approved.create({
          userId: user._id,
          eventId: currReq.eventId._id,
        });
        await user.updateOne({
          $push: {
            approved: approve._id,
          },
        });
        await currReq.eventId.updateOne({
          $push: {
            approved: user._id,
          },
        });
        await currReq.save();
      }
    }

    await user.save();

    await sendEventStatusEmail(user.email, "approved");

    return res.status(200).json({
      message: "Day 0 requests accepted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while approving Day 0 requests",
    });
  }
};

exports.approve10x = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("requests");
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    user.allowed = 2;
    const userRequests = user.requests;
    for (let request of userRequests) {
      const currReq = await Request.findById(request._id).populate("eventId");
      if (!currReq) {
        continue;
      }

      if (currReq.eventId.category !== "100x" && currReq.status === "pending") {
        //APPROVE THIS REQUEST
        currReq.status = "accepted";
        const approve = await Approved.create({
          userId: user._id,
          eventId: currReq.eventId._id,
        });
        await user.updateOne({
          $push: {
            approved: approve._id,
          },
        });
        await currReq.eventId.updateOne({
          $push: {
            approved: user._id,
          },
        });
        await currReq.save();
      }
    }

    await user.save();

    await sendEventStatusEmail(user.email, "approved");

    return res.status(200).json({
      message: "10x requests accepted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while approving 10x requests",
    });
  }
};

exports.approve100x = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("requests");
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    user.allowed = 3;
    const userRequests = user.requests;
    for (let request of userRequests) {
      const currReq = await Request.findById(request._id).populate("eventId");
      if (!currReq) {
        continue;
      }

      if (currReq.status === "pending") {
        //APPROVE THIS REQUEST
        currReq.status = "accepted";
        const approve = await Approved.create({
          userId: user._id,
          eventId: currReq.eventId._id,
        });
        await user.updateOne({
          $push: {
            approved: approve._id,
          },
        });
        await currReq.eventId.updateOne({
          $push: {
            approved: user._id,
          },
        });
        await currReq.save();
      }
    }

    await user.save();

    await sendEventStatusEmail(user.email, "approved");

    return res.status(200).json({
      message: "100x requests accepted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while approving 100x requests",
    });
  }
};

exports.approveOne = async (req, res) => {
  try {
    const { id } = req.params;

    //SEARCH FOR THE REQUEST
    const request = await Request.findById(id).populate("eventId userId");
    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(200).json({
        message: "Already approved",
      });
    }

    //ACCEPT
    request.status = "accepted";
    //SEND MAIL
    await sendEventStatusEmail(request.userId.email, "approved");

    //APPROVE
    const approve = await Approved.create({
      userId: request.userId._id,
      eventId: request.eventId._id,
    });

    //PUSH TO USER AND EVENT APPROVED ARRAY
    await request.userId.updateOne({
      $push: { approved: approve._id },
    });

    await request.eventId.updateOne({
      $push: { approved: approve._id },
    });

    await request.save();

    const event = await Event.findById(request.eventId)
      .populate({
        path: "requests",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "approved",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "attendees",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      });
    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    return res.status(200).json({
      message: "Request approved successfully",
      event,
    });
  } catch (error) {
    return res.status(500).json({ message: "Couldn't approve event" });
  }
};

exports.rejectOne = async (req, res) => {
  try {
    const { id } = req.params;

    //FETCH REQUEST
    const request = await Request.findById(id).populate("eventId userId");
    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(200).json({
        message: "Already approved/rejected",
      });
    }

    //REJECT
    request.status = "rejected";

    //SEND EMAIL
    await sendEventStatusEmail(request.userId.email, "rejected");

    await request.save();

    const event = await Event.findById(request.eventId)
      .populate({
        path: "requests",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "approved",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "attendees",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      });
    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    return res.status(200).json({
      message: "Request rejected successfully",
      event,
    });
  } catch {
    return res.status(500).json({ message: "Couldn't reject event" });
  }
};

exports.approveEventAll = async (req, res) => {
  try {
    const { requests } = req.body;

    let eventId = null;

    for (let r of requests) {
      //SEARCH FOR THE REQUEST
      const request = await Request.findById(r).populate("eventId userId");
      if (!request) {
        return res.status(404).json({
          message: "Request not found",
        });
      }

      if (request.status !== "pending") {
        continue;
      }

      const existingApproved = await Approved.findOne({
        userId: request.userId._id,
        eventId: request.eventId._id,
      });
      if (existingApproved) {
        return res.status(409).json({
          message: "Already approved",
        });
      }

      //ACCEPT
      request.status = "accepted";

      //SEND MAIL
      await sendEventStatusEmail(request.userId.email, "approved");

      //APPROVE
      const approve = await Approved.create({
        userId: request.userId._id,
        eventId: request.eventId._id,
      });

      //PUSH TO USER AND EVENT APPROVED ARRAY
      await request.userId.updateOne({
        $push: { approved: approve._id },
      });

      await request.eventId.updateOne({
        $push: { approved: approve._id },
      });

      if (!eventId) {
        eventId = request.eventId._id;
      }

      await request.save();
    }

    const event = await Event.findById(eventId)
      .populate({
        path: "requests",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "approved",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "attendees",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      });
    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    return res.status(200).json({
      message: "Events accepted successfully",
      event,
    });
  } catch (error) {
    return res.status(500).json({ message: "Couldn't accept all events" });
  }
};

exports.rejectEventAll = async (req, res) => {
  try {
    const { requests } = req.body;
    let eventId = null;
    for (let r of requests) {
      //SEARCH FOR THE REQUEST
      const request = await Request.findById(r).populate("eventId userId");
      if (!request) {
        return res.status(404).json({
          message: "Request not found",
        });
      }

      if (request.status !== "pending") {
        continue;
      }

      //REJECT
      request.updateOne({
        $set: {
          status: "rejected",
        },
      });

      //SEND MAIL
      await sendEventStatusEmail(request.userId.email, "rejected");

      if (!eventId) {
        eventId = request.eventId._id;
      }

      await request.save();
    }

    const event = await Event.findById(eventId)
      .populate({
        path: "requests",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "approved",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "attendees",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      });
    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    return res.status(200).json({
      message: "Events rejected successfully",
      event,
    });
  } catch (error) {
    return res.status(500).json({ message: "Couldn't reject events" });
  }
};

exports.enterOne = async (req, res) => {
  try {
    const { id } = req.params;

    const joined = await Joined.findById(id);
    if (!joined) {
      return res.status(404).json({
        message: "User joined not found",
      });
    }

    await joined.updateOne({
      $set: {
        status: "entered",
      },
    });

    await joined.save();

    const event = await Event.findById(joined.eventId)
      .populate({
        path: "requests",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "approved",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "attendees",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      });
    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    return res.status(200).json({
      message: "Joined entered successfully",
      event,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Couldn't enter event" });
  }
};

exports.deleteApproval = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const approved = await Approved.findById(id).populate("userId eventId");
    if (!approved) {
      return res.status(404).json({
        message: "Approved entry not found",
      });
    }

    const request = await Request.findOne({
      userId: approved.userId._id,
      eventId: approved.eventId._id,
    });
    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    await request.updateOne({
      $set: {
        status: "pending",
      },
    });

    await approved.userId.updateOne({
      $pull: {
        approved: id,
      },
    });
    await approved.eventId.updateOne({
      $pull: {
        approved: id,
      },
    });

    await approved.deleteOne();

    const event = await Event.findById(request.eventId)
      .populate({
        path: "requests",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "approved",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "attendees",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      });
    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    return res.status(200).json({
      message: "Approval deleted successfully",
      event,
    });
  } catch (error) {
    return res.status(500).json({ message: "Couldn't delete approval" });
  }
};
