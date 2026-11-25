const { Category, Event, TicketType, Booking, Review, User, Notification, Booth, Session, SessionRegistration } = require("../models");
const { AppError, asyncHandler, slugify, escapeRegex } = require("../lib/helpers");

const PUBLIC_STATUSES = ["approved", "completed"];

async function attachTickets(events) {
  const list = events.map((event) => (event.toObject ? event.toObject() : event));
  if (!list.length) return [];
  const tickets = await TicketType.find({ event: { $in: list.map((event) => event._id) } }).sort({ price: 1 });
  const grouped = new Map();
  tickets.forEach((ticket) => {
    const key = String(ticket.event);
    grouped.set(key, [...(grouped.get(key) || []), ticket]);
  });
  return list.map((event) => {
    const eventTickets = grouped.get(String(event._id)) || [];
    const sold = eventTickets.reduce((sum, ticket) => sum + ticket.sold, 0);
    const priceFrom = eventTickets.length ? Math.min(...eventTickets.map((ticket) => ticket.price)) : 0;
    return { ...event, tickets: eventTickets, sold, priceFrom };
  });
}

function cleanTickets(tickets) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    throw new AppError("Add at least one ticket type.");
  }
  return tickets.map((ticket) => {
    const name = String(ticket.name || "").trim();
    const price = Number(ticket.price);
    const quantity = Number(ticket.quantity);
    if (!name) throw new AppError("Every ticket needs a name.");
    if (!Number.isFinite(price) || price < 0) throw new AppError("Ticket price cannot be negative.");
    if (!Number.isInteger(quantity) || quantity < 1) throw new AppError("Ticket quantity must be a whole number.");
    return { _id: ticket._id, name, price, quantity };
  });
}

function assertDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new AppError("Enter a valid start and end.");
  if (end < start) throw new AppError("The end must be after the start.");
  return { start, end };
}

async function saveTickets(event, tickets, removeTicketIds = []) {
  const total = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  if (total > event.capacity) throw new AppError("Ticket quantities are higher than the event capacity.");
  for (const id of removeTicketIds) {
    const existing = await TicketType.findOne({ _id: id, event: event._id });
    if (!existing) continue;
    if (existing.sold > 0) throw new AppError(`${existing.name} has already sold and cannot be removed.`);
    await existing.deleteOne();
  }
  for (const ticket of tickets) {
    if (ticket._id) {
      const existing = await TicketType.findOne({ _id: ticket._id, event: event._id });
      if (!existing) continue;
      if (ticket.quantity < existing.sold) {
        throw new AppError(`${existing.name} already has ${existing.sold} tickets sold.`);
      }
      existing.name = ticket.name;
      existing.price = ticket.price;
      existing.quantity = ticket.quantity;
      await existing.save();
    } else {
      await TicketType.create({ event: event._id, name: ticket.name, price: ticket.price, quantity: ticket.quantity });
    }
  }
}

const facets = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const cities = await Event.distinct("city", { status: { $in: PUBLIC_STATUSES } });
  res.json({ categories, cities: cities.filter(Boolean).sort() });
});

const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (name.length < 2) throw new AppError("Enter a category name.");
  const category = await Category.create({ name, description: String(req.body.description || "").trim() });
  res.status(201).json({ category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError("Category not found.", 404);
  const name = String(req.body.name || "").trim();
  if (name.length < 2) throw new AppError("Enter a category name.");
  category.name = name;
  category.description = String(req.body.description || "").trim();
  await category.save();
  res.json({ category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const used = await Event.countDocuments({ category: req.params.id });
  if (used) throw new AppError("This category is used by events and cannot be deleted.");
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new AppError("Category not found.", 404);
  res.json({ ok: true });
});

const listEvents = asyncHandler(async (req, res) => {
  const filter = {};
  const scope = req.query.scope;
  if (scope === "mine") {
    if (!req.user || !["organizer", "admin"].includes(req.user.role)) throw new AppError("Sign in as an organizer.", 403);
    if (req.user.role === "organizer") filter.organizer = req.user._id;
  } else if (scope === "all") {
    if (!req.user || req.user.role !== "admin") throw new AppError("Admin access is required.", 403);
  } else {
    filter.status = { $in: PUBLIC_STATUSES };
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.city) filter.city = new RegExp(`^${escapeRegex(req.query.city)}$`, "i");
  if (req.query.q) {
    const pattern = new RegExp(escapeRegex(req.query.q), "i");
    filter.$or = [{ title: pattern }, { city: pattern }, { venue: pattern }, { summary: pattern }];
  }
  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .populate("category", "name")
    .populate("organizer", "name company");
  const decorated = await attachTickets(events);
  if (!scope || (scope !== "mine" && scope !== "all")) {
    decorated.sort((a, b) => {
      const aPast = new Date(a.endDate) < new Date() ? 1 : 0;
      const bPast = new Date(b.endDate) < new Date() ? 1 : 0;
      if (aPast !== bPast) return aPast - bPast;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }
  res.json({ events: decorated });
});

const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate("category", "name").populate("organizer", "name company");
  if (!event) throw new AppError("Event not found.", 404);
  const isOwner = req.user && String(event.organizer._id || event.organizer) === String(req.user._id);
  const isAdmin = req.user && req.user.role === "admin";
  if (!PUBLIC_STATUSES.includes(event.status) && !isOwner && !isAdmin) {
    throw new AppError("Event not found.", 404);
  }
  const [withTicket] = await attachTickets([event]);
  const sessions = await Session.find({ event: event._id }).sort({ startTime: 1 });
  const reviews = await Review.find({ event: event._id }).sort({ createdAt: -1 }).populate("user", "name");
  const booths = await Booth.find({ event: event._id, status: "approved" }).select("company size");
  const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  let canReview = false;
  let myReview = null;
  let hasTicket = false;
  if (req.user) {
    myReview = reviews.find((review) => String(review.user._id || review.user) === String(req.user._id)) || null;
    const booking = await Booking.findOne({ user: req.user._id, event: event._id, status: "confirmed" });
    hasTicket = Boolean(booking);
    canReview = Boolean(booking) && new Date(event.endDate) < new Date() && !myReview;
  }
  res.json({ event: withTicket, sessions, reviews, booths, rating, canReview, myReview, hasTicket });
});

const createEvent = asyncHandler(async (req, res) => {
  const tickets = cleanTickets(req.body.tickets);
  const { start, end } = assertDates(req.body.startDate, req.body.endDate);
  const category = await Category.findById(req.body.category);
  if (!category) throw new AppError("Choose a valid category.");
  const capacity = Number(req.body.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) throw new AppError("Capacity must be a whole number.");
  const highlights = Array.isArray(req.body.highlights)
    ? req.body.highlights.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
    : [];
  const event = await Event.create({
    title: String(req.body.title || "").trim(),
    slug: slugify(req.body.title),
    summary: String(req.body.summary || "").trim(),
    description: String(req.body.description || "").trim(),
    category: category._id,
    organizer: req.user._id,
    city: String(req.body.city || "").trim(),
    venue: String(req.body.venue || "").trim(),
    startDate: start,
    endDate: end,
    capacity,
    tone: ["clay", "pine", "ink", "gold", "dusk"].includes(req.body.tone) ? req.body.tone : "clay",
    highlights,
    status: req.body.publish ? "pending" : "draft",
  });
  if (!event.title || !event.summary || !event.description || !event.city || !event.venue) {
    await event.deleteOne();
    throw new AppError("Title, summary, description, city, and venue are required.");
  }
  try {
    await saveTickets(event, tickets);
  } catch (error) {
    await TicketType.deleteMany({ event: event._id });
    await event.deleteOne();
    throw error;
  }
  if (event.status === "pending") {
    const admins = await User.find({ role: "admin", status: "active" }).select("_id");
    await Notification.insertMany(
      admins.map((admin) => ({
        user: admin._id,
        title: "Event awaiting approval",
        body: `${event.title} was submitted by ${req.user.name}.`,
        link: "/app/approvals",
      }))
    );
  }
  const populated = await Event.findById(event._id).populate("category", "name").populate("organizer", "name company");
  const [full] = await attachTickets([populated]);
  res.status(201).json({ event: full });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found.", 404);
  const isOwner = String(event.organizer) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin") throw new AppError("You cannot edit this event.", 403);
  if (event.status === "completed") throw new AppError("Completed events are locked.");
  const { start, end } = assertDates(req.body.startDate, req.body.endDate);
  const category = await Category.findById(req.body.category);
  if (!category) throw new AppError("Choose a valid category.");
  const capacity = Number(req.body.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) throw new AppError("Capacity must be a whole number.");
  const sold = await TicketType.aggregate([
    { $match: { event: event._id } },
    { $group: { _id: null, sold: { $sum: "$sold" } } },
  ]);
  if (capacity < (sold[0]?.sold || 0)) throw new AppError("Capacity cannot be lower than tickets already sold.");
  event.title = String(req.body.title || "").trim();
  event.summary = String(req.body.summary || "").trim();
  event.description = String(req.body.description || "").trim();
  event.category = category._id;
  event.city = String(req.body.city || "").trim();
  event.venue = String(req.body.venue || "").trim();
  event.startDate = start;
  event.endDate = end;
  event.capacity = capacity;
  event.tone = ["clay", "pine", "ink", "gold", "dusk"].includes(req.body.tone) ? req.body.tone : event.tone;
  event.highlights = Array.isArray(req.body.highlights)
    ? req.body.highlights.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
    : [];
  if (!event.title || !event.summary || !event.description || !event.city || !event.venue) {
    throw new AppError("Title, summary, description, city, and venue are required.");
  }
  if (["draft", "pending", "rejected"].includes(event.status)) {
    event.status = req.body.publish ? "pending" : "draft";
    event.reviewNote = "";
  }
  await event.save();
  if (Array.isArray(req.body.tickets)) {
    await saveTickets(event, cleanTickets(req.body.tickets), req.body.removeTicketIds || []);
  }
  const populated = await Event.findById(event._id).populate("category", "name").populate("organizer", "name company");
  const [full] = await attachTickets([populated]);
  res.json({ event: full });
});

const removeEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found.", 404);
  const isOwner = String(event.organizer) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin") throw new AppError("You cannot delete this event.", 403);
  if (["approved", "completed"].includes(event.status)) {
    throw new AppError("Approved events stay on record.");
  }
  await Promise.all([
    TicketType.deleteMany({ event: event._id }),
    Session.deleteMany({ event: event._id }),
    SessionRegistration.deleteMany({ event: event._id }),
    Booth.deleteMany({ event: event._id }),
    Review.deleteMany({ event: event._id }),
    Booking.deleteMany({ event: event._id }),
  ]);
  await event.deleteOne();
  res.json({ ok: true });
});

const setEventStatus = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!["approved", "rejected"].includes(status)) throw new AppError("Choose approve or reject.");
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found.", 404);
  if (event.status !== "pending") throw new AppError("Only events waiting for review can be decided.");
  event.status = status;
  event.reviewNote = String(req.body.note || "").trim();
  await event.save();
  await Notification.create({
    user: event.organizer,
    title: status === "approved" ? "Event approved" : "Event needs changes",
    body: event.reviewNote || `${event.title} was ${status}.`,
    link: "/app/events",
  });
  res.json({ event });
});

const createReview = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found.", 404);
  if (new Date(event.endDate) > new Date()) throw new AppError("Reviews open after the event ends.");
  const booking = await Booking.findOne({ user: req.user._id, event: event._id, status: "confirmed" });
  if (!booking) throw new AppError("Only ticket holders can review this event.");
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError("Choose a rating from 1 to 5.");
  if (comment.length < 4) throw new AppError("Write a short comment.");
  const review = await Review.create({ event: event._id, user: req.user._id, rating, comment });
  const populated = await review.populate("user", "name");
  res.status(201).json({ review: populated });
});

const listReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).populate("user", "name email").populate("event", "title");
  res.json({ reviews });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new AppError("Review not found.", 404);
  res.json({ ok: true });
});

module.exports = {
  facets,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  removeEvent,
  setEventStatus,
  createReview,
  listReviews,
  deleteReview,
};
