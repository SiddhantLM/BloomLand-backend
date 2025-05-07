const User = require("../models/user");
const Event = require("../models/event");
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
      if (requests[i].category === "day0") {
        if (maxi < 1) {
          maxi = 1;
        }
      } else if (requests[i].category === "10x") {
        if (maxi < 2) {
          maxi = 2;
        }
      } else if (requests[i].category === "100x") {
        if (maxi < 3) {
          maxi = 3;
        }
      }

      const eve = await Event.findById(requests[i]._id);
      if (!eve) {
        return res.status(404).json({
          message: "Event not found",
        });
      }
      await eve.updateOne({
        $pull: {
          requests: user._id,
        },
      });
      await eve.updateOne({
        $push: {
          approved: user._id,
        },
      });
      await eve.save();
    }
    user.allowed = maxi;

    user.approved.push(...requests);
    user.requests = [];
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

    const user = await User.findById(userId).populate("requests");
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    user.allowed = 0;
    user.requests = [];
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
    const requests = user.requests.filter(
      (request) => request.category === "day0"
    );

    for (let request in requests) {
      const eve = await Event.findById(request._id);
      if (!eve) {
        return res.status(404).json({
          message: "Event not found",
        });
      }
      await eve.updateOne({
        $pull: {
          requests: user._id,
        },
      });
      await eve.updateOne({
        $push: {
          approved: user._id,
        },
      });
      await eve.save();
    }

    user.approved.push(...requests);

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
    const requests = user.requests.filter(
      (request) => request.category === "day0" || request.category === "10x"
    );
    for (let request in requests) {
      const eve = await Event.findById(request._id);
      if (!eve) {
        return res.status(404).json({
          message: "Event not found",
        });
      }
      await eve.updateOne({
        $pull: {
          requests: user._id,
        },
      });
      await eve.updateOne({
        $push: {
          approved: user._id,
        },
      });
      await eve.save();
    }
    user.approved.push(...requests);

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
    const requests = user.requests.filter(
      (request) =>
        request.category === "day0" ||
        request.category === "100x" ||
        request.category === "10x"
    );
    for (let request in requests) {
      const eve = await Event.findById(request._id);
      if (!eve) {
        return res.status(404).json({
          message: "Event not found",
        });
      }
      await eve.updateOne({
        $pull: {
          requests: user._id,
        },
      });
      await eve.updateOne({
        $push: {
          approved: user._id,
        },
      });
      await eve.save();
    }
    user.approved.push(...requests);

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
