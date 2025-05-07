const jwt = require("jsonwebtoken");

const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token not provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(403).json({ message: "Token is invalid" });
    }
    // Check if user is admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying token", error);
    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = { isAdmin };
