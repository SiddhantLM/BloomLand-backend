const User = require("../models/user");
const { sendWelcomeEmail } = require("../utils/mailer");

exports.joinCommunity = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(400).json({
        message: "User ID required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isCommunity === true) {
      return res.status(400).json({
        message: "Community already joined",
      });
    }

    user.isCommunity = true;
    await sendWelcomeEmail(user.email, process.env.WHATSAPP_LINK);
    await user.save();

    return res.status(200).json({
      message: "Joined the community successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while joining the community",
    });
  }
};
