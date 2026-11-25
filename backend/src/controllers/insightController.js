const { User, Event, Booking, Booth, Category } = require("../models");
const { AppError, asyncHandler } = require("../lib/helpers");

function money(value) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value || 0);
}

async function confirmedRevenue(match) {
  const rows = await Booking.aggregate([
    { $match: { status: "confirmed", ...match } },
    { $group: { _id: null, total: { $sum: "$amount" }, tickets: { $sum: "$quantity" } } },
  ]);
  return rows[0] || { total: 0, tickets: 0 };
}

const dashboard = asyncHandler(async (req, res) => {
  if (req.user.role === "admin") {
    const [people, liveEvents, pendingEvents, pendingBooths, revenue, byCategory, recentBookings] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments({ status: { $in: ["approved", "completed"] } }),
      Event.countDocuments({ status: "pending" }),
      Booth.countDocuments({ status: "requested" }),
      confirmedRevenue({}),
      Event.aggregate([
        { $match: { status: { $in: ["approved", "completed", "pending"] } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Booking.find().sort({ createdAt: -1 }).limit(5).populate("event", "title").populate("user", "name"),
    ]);
    const categories = await Category.find({ _id: { $in: byCategory.map((row) => row._id) } });
    const names = new Map(categories.map((category) => [String(category._id), category.name]));
    return res.json({
      cards: [
        { label: "People", value: String(people), note: "All roles" },
        { label: "Published events", value: String(liveEvents), note: "Approved or completed" },
        { label: "Tickets sold", value: String(revenue.tickets), note: "Confirmed bookings" },
        { label: "Ticket revenue", value: money(revenue.total), note: "Demo payments" },
      ],
      series: byCategory.map((row) => ({ label: names.get(String(row._id)) || "Category", value: row.count })),
      queue: [
        { label: "Events to review", href: "/app/approvals", count: pendingEvents },
        { label: "Booth requests", href: "/app/booths", count: pendingBooths },
      ],
      recentBookings,
    });
  }

  if (req.user.role === "organizer") {
    const events = await Event.find({ organizer: req.user._id }).sort({ startDate: 1 });
    const ids = events.map((event) => event._id);
    const [revenue, booths, recentBookings] = await Promise.all([
      confirmedRevenue({ event: { $in: ids } }),
      Booth.countDocuments({ event: { $in: ids }, status: "requested" }),
      Booking.find({ event: { $in: ids } }).sort({ createdAt: -1 }).limit(5).populate("event", "title").populate("user", "name"),
    ]);
    return res.json({
      cards: [
        { label: "My events", value: String(events.length), note: `${events.filter((event) => event.status === "approved").length} approved` },
        { label: "Tickets sold", value: String(revenue.tickets), note: "Across your events" },
        { label: "Revenue", value: money(revenue.total), note: "Confirmed only" },
        { label: "Booth queue", value: String(booths), note: "Waiting on you" },
      ],
      upcoming: events.filter((event) => new Date(event.endDate) >= new Date()).slice(0, 4),
      recentBookings,
    });
  }

  if (req.user.role === "exhibitor") {
    const booths = await Booth.find({ exhibitor: req.user._id }).populate("event", "title city startDate status");
    const openEvents = await Event.find({ status: "approved", endDate: { $gte: new Date() } })
      .sort({ startDate: 1 })
      .limit(4)
      .select("title city startDate");
    return res.json({
      cards: [
        { label: "Approved booths", value: String(booths.filter((booth) => booth.status === "approved").length) },
        { label: "Waiting", value: String(booths.filter((booth) => booth.status === "requested").length) },
        { label: "Declined", value: String(booths.filter((booth) => booth.status === "rejected").length) },
        { label: "Open floors", value: String(openEvents.length), note: "Approved events" },
      ],
      booths,
      upcoming: openEvents,
    });
  }

  const bookings = await Booking.find({ user: req.user._id, status: "confirmed" })
    .sort({ createdAt: -1 })
    .populate("event", "title city startDate venue endDate");
  const upcoming = bookings.filter((booking) => new Date(booking.event.endDate) >= new Date());
  const spent = bookings.reduce((sum, booking) => sum + booking.amount, 0);
  const { SessionRegistration } = require("../models");
  const sessions = await SessionRegistration.countDocuments({ user: req.user._id });
  res.json({
    cards: [
      { label: "Upcoming tickets", value: String(upcoming.length) },
      { label: "Sessions saved", value: String(sessions) },
      { label: "Spent", value: money(spent), note: "Confirmed tickets" },
      { label: "Checked in", value: String(bookings.filter((booking) => booking.checkedIn).length) },
    ],
    upcoming: upcoming.slice(0, 4).map((booking) => ({
      _id: booking._id,
      title: booking.event.title,
      city: booking.event.city,
      startDate: booking.event.startDate,
    })),
  });
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select("-password");
  res.json({ users });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("Person not found.", 404);
  if (String(user._id) === String(req.user._id) && req.body.status === "suspended") {
    throw new AppError("You cannot suspend your own account.");
  }
  if (req.body.status && !["active", "suspended"].includes(req.body.status)) {
    throw new AppError("Status must be active or suspended.");
  }
  if (req.body.status) user.status = req.body.status;
  if (req.body.role && user.role !== "admin") {
    if (!["organizer", "exhibitor", "attendee"].includes(req.body.role)) throw new AppError("Unknown role.");
    user.role = req.body.role;
  }
  await user.save();
  res.json({ user });
});

module.exports = { dashboard, listUsers, updateUser };
