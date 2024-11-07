const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized - Token missing." });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid token format." });
  }

  const token = authHeader.substring(7);

  try {
    const secretKey = process.env.JWT_TOKEN_SECRET_KEY;
    const decoded = jwt.verify(token, secretKey);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized - Invalid token." });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role === "admin") {
    next();
  } else {
    console.log("Only Admin has access to this route.");
    res.status(403).json({ error: "Forbidden" });
  }
};

module.exports = {
  authMiddleware,
  isAdmin,
};
