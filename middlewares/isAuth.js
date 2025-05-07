const jwt = require("jsonwebtoken");
require("dotenv").config();

const isAuth = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded)
      return res
        .status(401)
        .json({ message: "Invalid token, authorization denied" });
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Access denied, please login" });
  }
};
module.exports = { isAuth };
