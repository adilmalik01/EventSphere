const express = require("express");
const auth = require("../controllers/authController");
const events = require("../controllers/eventController");
const bookings = require("../controllers/bookingController");
const floor = require("../controllers/floorController");
const insight = require("../controllers/insightController");
const { protect, optionalAuth, allow } = require("../middleware/auth");
const { validate } = require("../middleware/error");

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true, service: "eventsphere" }));

router.post("/auth/register", auth.registerRules(), validate, auth.register);
router.post("/auth/login", auth.loginRules(), validate, auth.login);
router.get("/auth/me", protect, auth.me);
router.put("/auth/profile", protect, auth.updateProfile);
router.get("/notifications", protect, auth.notifications);
router.patch("/notifications/read", protect, auth.readNotifications);

router.get("/categories", events.listCategories);
router.post("/categories", protect, allow("admin"), events.createCategory);
router.put("/categories/:id", protect, allow("admin"), events.updateCategory);
router.delete("/categories/:id", protect, allow("admin"), events.deleteCategory);

router.get("/events/facets", events.facets);
router.get("/events", optionalAuth, events.listEvents);
router.get("/events/:id", optionalAuth, events.getEvent);
router.post("/events", protect, allow("organizer"), events.createEvent);
router.put("/events/:id", protect, allow("organizer", "admin"), events.updateEvent);
router.delete("/events/:id", protect, allow("organizer", "admin"), events.removeEvent);
router.patch("/events/:id/status", protect, allow("admin"), events.setEventStatus);
router.post("/events/:id/reviews", protect, events.createReview);
router.get("/reviews", protect, allow("admin"), events.listReviews);
router.delete("/reviews/:id", protect, allow("admin"), events.deleteReview);

router.post("/bookings", protect, bookings.createBooking);
router.get("/bookings", protect, bookings.listBookings);
router.patch("/bookings/:id/cancel", protect, bookings.cancelBooking);
router.post("/checkin", protect, allow("organizer", "admin"), bookings.checkIn);

router.get("/sessions", protect, allow("organizer", "admin"), floor.listSessions);
router.post("/sessions", protect, allow("organizer", "admin"), floor.createSession);
router.put("/sessions/:id", protect, allow("organizer", "admin"), floor.updateSession);
router.delete("/sessions/:id", protect, allow("organizer", "admin"), floor.deleteSession);
router.get("/agenda", protect, floor.myAgenda);
router.post("/sessions/:id/register", protect, floor.registerSession);
router.delete("/sessions/:id/register", protect, floor.leaveSession);

router.get("/booths", protect, floor.listBooths);
router.post("/booths", protect, allow("exhibitor"), floor.requestBooth);
router.patch("/booths/:id/status", protect, allow("organizer", "admin"), floor.setBoothStatus);

router.get("/dashboard", protect, insight.dashboard);
router.get("/users", protect, allow("admin"), insight.listUsers);
router.patch("/users/:id", protect, allow("admin"), insight.updateUser);

module.exports = router;
