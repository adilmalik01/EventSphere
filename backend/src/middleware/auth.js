const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { AppError, asyncHandler } = require("../lib/helpers");

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new AppError("Sign in to continue.", 401);
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError("Your session has expired. Sign in again.", 401);
  }
  const user = await User.findById(decoded.id);
  if (!user || user.status !== "active") {
    throw new AppError("This account cannot sign in.", 401);
  }
  req.user = user;
  next();
});

async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.status === "active") req.user = user;
  } catch {
    req.user = undefined;
  }
  next();
}

const allow = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError("You do not have access to this action.", 403));
  }
  next();
};

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
}

module.exports = { protect, optionalAuth, allow, signToken };
