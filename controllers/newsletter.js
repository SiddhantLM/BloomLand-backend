const Newsletter = require("../models/newsletter");

exports.addEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Email required",
      });
    }

    const existingUser = await Newsletter.findOne({ email: email });

    if (existingUser) {
      console.log(existingUser);
      return res.status(400).json({
        message: "Already subscribed",
      });
    }

    await Newsletter.create({
      email: email,
    });

    return res.status(200).json({
      message: "Subscribed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while subscribing to newsletter",
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const newsletterUsers = await Newsletter.find({});
    return res.status(200).json({
      message: "Newsletters fetched successfully",
      newsletterUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while fetching newsletter data",
    });
  }
};
