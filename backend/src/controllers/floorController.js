const { Event, Session, SessionRegistration, Booking, Booth, Notification } = require("../models");
const { AppError, asyncHandler, BOOTH_PRICES } = require("../lib/helpers");

async function ownEvent(id, user) {
  const event = await Event.findById(id);
  if (!event) throw new AppError("Event not found.", 404);
  if (user.role !== "admin" && String(event.organizer) !== String(user._id)) {
    throw new AppError("You cannot change this event.", 403);
  }
  return event;
}

const listSessions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.event) filter.event = req.query.event;
  if (req.user.role === "organizer") {
    const events = await Event.find({ organizer: req.user._id }).select("_id");
    const ids = events.map((event) => String(event._id));
    if (req.query.event && !ids.includes(String(req.query.event))) {
      throw new AppError("You cannot view that program.", 403);
    }
    filter.event = req.query.event || { $in: events.map((event) => event._id) };
  }
  const sessions = await Session.find(filter).sort({ startTime: 1 }).populate("event", "title startDate endDate");
  res.json({ sessions });
});

const createSession = asyncHandler(async (req, res) => {
  const event = await ownEvent(req.body.eventId, req.user);
  const startTime = new Date(req.body.startTime);
  const endTime = new Date(req.body.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || endTime <= startTime) {
    throw new AppError("Enter a valid session time.");
  }
  if (startTime < event.startDate || endTime > event.endDate) {
    throw new AppError("The session must sit inside the event dates.");
  }
  const capacity = Number(req.body.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) throw new AppError("Enter a session capacity.");
  const session = await Session.create({
    event: event._id,
    title: String(req.body.title || "").trim(),
    speaker: String(req.body.speaker || "").trim(),
    hall: String(req.body.hall || "").trim(),
    description: String(req.body.description || "").trim(),
    startTime,
    endTime,
    capacity,
  });
  if (!session.title || !session.speaker || !session.hall) {
    await session.deleteOne();
    throw new AppError("Title, speaker, and hall are required.");
  }
  res.status(201).json({ session });
});

const updateSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new AppError("Session not found.", 404);
  await ownEvent(session.event, req.user);
  const capacity = Number(req.body.capacity);
  if (!Number.isInteger(capacity) || capacity < session.registered) {
    throw new AppError("Capacity cannot be lower than the people already registered.");
  }
  session.title = String(req.body.title || session.title).trim();
  session.speaker = String(req.body.speaker || session.speaker).trim();
  session.hall = String(req.body.hall || session.hall).trim();
  session.description = String(req.body.description || "").trim();
  session.capacity = capacity;
  await session.save();
  res.json({ session });
});

const deleteSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new AppError("Session not found.", 404);
  await ownEvent(session.event, req.user);
  const regs = await SessionRegistration.find({ session: session._id });
  if (regs.length) {
    await Notification.insertMany(
      regs.map((reg) => ({
        user: reg.user,
        title: "Session removed",
        body: `${session.title} was taken off the program.`,
        link: `/events/${session.event}`,
      }))
    );
    await SessionRegistration.deleteMany({ session: session._id });
  }
  await session.deleteOne();
  res.json({ ok: true });
});

const myAgenda = asyncHandler(async (req, res) => {
  const regs = await SessionRegistration.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate({ path: "session", populate: { path: "event", select: "title city startDate" } });
  res.json({ agenda: regs });
});

const registerSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new AppError("Session not found.", 404);
  const booking = await Booking.findOne({ user: req.user._id, event: session.event, status: "confirmed" });
  if (!booking) throw new AppError("Book a ticket for this event before joining a session.");
  const seat = await Session.findOneAndUpdate(
    { _id: session._id, $expr: { $lt: ["$registered", "$capacity"] } },
    { $inc: { registered: 1 } },
    { new: true }
  );
  if (!seat) throw new AppError("This session is full.");
  try {
    const registration = await SessionRegistration.create({
      session: session._id,
      event: session.event,
      user: req.user._id,
    });
    res.status(201).json({ registration, session: seat });
  } catch (error) {
    await Session.updateOne({ _id: session._id }, { $inc: { registered: -1 } });
    if (error.code === 11000) throw new AppError("You are already on this session.");
    throw error;
  }
});

const leaveSession = asyncHandler(async (req, res) => {
  const registration = await SessionRegistration.findOneAndDelete({ session: req.params.id, user: req.user._id });
  if (!registration) throw new AppError("You are not registered for this session.", 404);
  await Session.updateOne({ _id: req.params.id }, { $inc: { registered: -1 } });
  res.json({ ok: true });
});

const listBooths = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "exhibitor") filter.exhibitor = req.user._id;
  if (req.user.role === "organizer") {
    const events = await Event.find({ organizer: req.user._id }).select("_id");
    filter.event = { $in: events.map((event) => event._id) };
  }
  if (req.query.status) filter.status = req.query.status;
  const booths = await Booth.find(filter)
    .sort({ createdAt: -1 })
    .populate("event", "title city startDate status")
    .populate("exhibitor", "name email company");
  res.json({ booths, prices: BOOTH_PRICES });
});

const requestBooth = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.body.eventId);
  if (!event || event.status !== "approved") throw new AppError("Booths open only on approved events.");
  const size = req.body.size;
  if (!BOOTH_PRICES[size]) throw new AppError("Choose a booth size.");
  const open = await Booth.findOne({
    event: event._id,
    exhibitor: req.user._id,
    status: { $in: ["requested", "approved"] },
  });
  if (open) throw new AppError("You already have a booth request for this event.");
  const booth = await Booth.create({
    event: event._id,
    exhibitor: req.user._id,
    company: String(req.body.company || req.user.company || req.user.name).trim(),
    size,
    price: BOOTH_PRICES[size],
    pitch: String(req.body.pitch || "").trim(),
  });
  if (!booth.company) {
    await booth.deleteOne();
    throw new AppError("Add a company name.");
  }
  await Notification.create({
    user: event.organizer,
    title: "New booth request",
    body: `${booth.company} asked for a ${size} booth at ${event.title}.`,
    link: "/app/booths",
  });
  res.status(201).json({ booth });
});

const setBoothStatus = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!["approved", "rejected"].includes(status)) throw new AppError("Choose approve or reject.");
  const booth = await Booth.findById(req.params.id).populate("event", "title organizer");
  if (!booth) throw new AppError("Booth request not found.", 404);
  if (req.user.role !== "admin" && String(booth.event.organizer) !== String(req.user._id)) {
    throw new AppError("You cannot decide this request.", 403);
  }
  if (booth.status !== "requested") throw new AppError("This request was already decided.");
  booth.status = status;
  booth.note = String(req.body.note || "").trim();
  await booth.save();
  await Notification.create({
    user: booth.exhibitor,
    title: status === "approved" ? "Booth approved" : "Booth request declined",
    body: booth.note || `Your booth at ${booth.event.title} was ${status}.`,
    link: "/app/booths",
  });
  res.json({ booth });
});

module.exports = {
  listSessions,
  createSession,
  updateSession,
  deleteSession,
  myAgenda,
  registerSession,
  leaveSession,
  listBooths,
  requestBooth,
  setBoothStatus,
};
