const { body } = require("express-validator");
const { User, Notification } = require("../models");
const { AppError, asyncHandler } = require("../lib/helpers");
const { signToken } = require("../middleware/auth");

const failures = new Map();

function assertPassword(password) {
  if (!password || password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError("Use at least 6 characters with a letter and a number.");
  }
}

function registerRules() {
  return [
    body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Enter your full name."),
    body("email").isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
    body("password").notEmpty().withMessage("Choose a password."),
  ];
}

function loginRules() {
  return [
    body("email").isEmail().withMessage("Enter the email you registered with.").normalizeEmail(),
    body("password").notEmpty().withMessage("Enter your password."),
  ];
}

const register = asyncHandler(async (req, res) => {
  assertPassword(req.body.password);
  const email = req.body.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw new AppError("An account with this email already exists.", 409);
  const role = ["organizer", "exhibitor", "attendee"].includes(req.body.role) ? req.body.role : "attendee";
  const user = await User.create({
    name: req.body.name.trim(),
    email,
    password: req.body.password,
    role,
    phone: (req.body.phone || "").trim(),
    company: (req.body.company || "").trim(),
  });
  res.status(201).json({ token: signToken(user), user });
});

const login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const now = Date.now();
  const recent = (failures.get(email) || []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 8) {
    throw new AppError("Too many failed attempts. Wait a few minutes and try again.", 429);
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(req.body.password))) {
    recent.push(now);
    failures.set(email, recent);
    throw new AppError("Email or password is incorrect.", 401);
  }
  if (user.status !== "active") throw new AppError("This account is suspended. Contact an administrator.", 403);
  failures.delete(email);
  user.password = undefined;
  res.json({ token: signToken(user), user });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, company, bio, currentPassword, nextPassword } = req.body;
  if (!name || name.trim().length < 2) throw new AppError("Enter your name.");
  const user = await User.findById(req.user._id).select("+password");
  user.name = name.trim();
  user.phone = (phone || "").trim();
  user.company = (company || "").trim();
  user.bio = (bio || "").trim();
  if (nextPassword) {
    if (!currentPassword) throw new AppError("Enter your current password to set a new one.");
    const matches = await user.comparePassword(currentPassword);
    if (!matches) throw new AppError("Current password is incorrect.", 401);
    assertPassword(nextPassword);
    user.password = nextPassword;
  }
  await user.save();
  user.password = undefined;
  res.json({ user });
});

const notifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(12);
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ notifications: items, unread });
});

const readNotifications = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});

module.exports = {
  registerRules,
  loginRules,
  register,
  login,
  me,
  updateProfile,
  notifications,
  readNotifications,
};
