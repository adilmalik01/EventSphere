const { Event, TicketType, Booking, Notification } = require("../models");
const { AppError, asyncHandler, ticketCode, paymentReference, withQr } = require("../lib/helpers");

const createBooking = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new AppError("Choose between 1 and 10 tickets.");
  }
  const method = req.body.paymentMethod === "counter" ? "counter" : "card";
  const event = await Event.findById(req.body.eventId);
  if (!event || event.status !== "approved") throw new AppError("This event is not open for booking.", 404);
  if (new Date(event.endDate) < new Date()) throw new AppError("This event has already ended.");
  const ticket = await TicketType.findOneAndUpdate(
    {
      _id: req.body.ticketTypeId,
      event: event._id,
      $expr: { $lte: [{ $add: ["$sold", quantity] }, "$quantity"] },
    },
    { $inc: { sold: quantity } },
    { new: true }
  );
  if (!ticket) throw new AppError("Not enough tickets are left for that pass.");
  let booking;
  try {
    booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      ticketType: ticket._id,
      quantity,
      amount: ticket.price * quantity,
      paymentMethod: method,
      paymentReference: paymentReference(),
      ticketCode: ticketCode(),
    });
    await Notification.create({
      user: req.user._id,
      title: "Ticket confirmed",
      body: `${quantity} × ${ticket.name} for ${event.title}. Code ${booking.ticketCode}.`,
      link: "/app/bookings",
    });
    const populated = await Booking.findById(booking._id)
      .populate("event", "title city startDate venue")
      .populate("ticketType", "name price")
      .populate("user", "name email");
    res.status(201).json({ booking: await withQr(populated) });
  } catch (error) {
    if (booking) await Booking.deleteOne({ _id: booking._id });
    await TicketType.updateOne({ _id: ticket._id }, { $inc: { sold: -quantity } });
    throw error;
  }
});

const listBookings = asyncHandler(async (req, res) => {
  const filter = {};
  const ownsTickets = req.user.role === "attendee" || req.user.role === "exhibitor";
  if (ownsTickets) filter.user = req.user._id;
  if (req.user.role === "organizer") {
    const events = await Event.find({ organizer: req.user._id }).select("_id");
    filter.event = { $in: events.map((event) => event._id) };
  }
  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("event", "title city startDate venue")
    .populate("ticketType", "name price")
    .populate("user", "name email");
  const payload = ownsTickets ? await Promise.all(bookings.map((booking) => withQr(booking))) : bookings;
  res.json({ bookings: payload });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("event", "title startDate organizer");
  if (!booking) throw new AppError("Booking not found.", 404);
  const owns = String(booking.user) === String(req.user._id);
  if (!owns && req.user.role !== "admin") throw new AppError("You cannot cancel this booking.", 403);
  if (booking.status !== "confirmed") throw new AppError("This booking is already cancelled.");
  if (booking.checkedIn) throw new AppError("Checked-in tickets cannot be cancelled.");
  if (new Date(booking.event.startDate) <= new Date()) {
    throw new AppError("Cancellation closes once the event has started.");
  }
  booking.status = "cancelled";
  await booking.save();
  await TicketType.updateOne({ _id: booking.ticketType }, { $inc: { sold: -booking.quantity } });
  await Notification.create({
    user: booking.user,
    title: "Booking cancelled",
    body: `Your tickets for ${booking.event.title} were cancelled.`,
    link: "/app/bookings",
  });
  res.json({ booking });
});

const checkIn = asyncHandler(async (req, res) => {
  const code = String(req.body.ticketCode || "").trim().toUpperCase();
  if (!code) throw new AppError("Enter a ticket code.");
  const booking = await Booking.findOne({ ticketCode: code })
    .populate("event", "title organizer city")
    .populate("user", "name email")
    .populate("ticketType", "name");
  if (!booking) throw new AppError("No ticket matches that code.", 404);
  if (req.user.role === "organizer" && String(booking.event.organizer) !== String(req.user._id)) {
    throw new AppError("This ticket belongs to another organizer.", 403);
  }
  if (booking.status !== "confirmed") throw new AppError("This ticket is not active.");
  if (booking.checkedIn) {
    throw new AppError(`Already checked in at ${new Date(booking.checkedInAt).toLocaleString("en-PK")}.`);
  }
  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  await booking.save();
  res.json({ booking });
});

module.exports = { createBooking, listBookings, cancelBooking, checkIn };
