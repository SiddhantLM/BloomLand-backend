const User = require("../models/user");
const jwt = require("jsonwebtoken");

const request = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        message: "You need to login first",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(400).json({
        message: "You are unauthorized",
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "You are unauthorized",
    });
  }
};

module.exports = { request };
