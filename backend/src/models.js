const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["admin", "organizer", "exhibitor", "attendee"],
      default: "attendee",
    },
    phone: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "", maxlength: 400 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
    description: { type: String, trim: true, default: "", maxlength: 200 },
  },
  { timestamps: true }
);

const eventSchema = new Schema(
  {
    code: { type: String, unique: true, sparse: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    venue: { type: String, required: true, trim: true, maxlength: 120 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    tone: { type: String, enum: ["clay", "pine", "ink", "gold", "dusk"], default: "clay" },
    highlights: [{ type: String, maxlength: 80 }],
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "completed"],
      default: "draft",
    },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

const ticketSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    sold: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    ticketType: { type: Schema.Types.ObjectId, ref: "TicketType", required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    paymentMethod: { type: String, enum: ["card", "counter"], required: true },
    paymentReference: { type: String, required: true },
    ticketCode: { type: String, required: true, unique: true },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: Date,
  },
  { timestamps: true }
);

const sessionSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    speaker: { type: String, required: true, trim: true, maxlength: 80 },
    hall: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, default: "", maxlength: 500 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    registered: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const sessionRegistrationSchema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
sessionRegistrationSchema.index({ session: 1, user: 1 }, { unique: true });

const boothSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    exhibitor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true, trim: true, maxlength: 80 },
    size: { type: String, enum: ["3x3", "3x6", "6x6"], required: true },
    price: { type: Number, required: true, min: 0 },
    pitch: { type: String, trim: true, default: "", maxlength: 500 },
    status: { type: String, enum: ["requested", "approved", "rejected"], default: "requested" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

const reviewSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 600 },
  },
  { timestamps: true }
);
reviewSchema.index({ event: 1, user: 1 }, { unique: true });

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 400 },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model("User", userSchema),
  Category: mongoose.model("Category", categorySchema),
  Event: mongoose.model("Event", eventSchema),
  TicketType: mongoose.model("TicketType", ticketSchema),
  Booking: mongoose.model("Booking", bookingSchema),
  Session: mongoose.model("Session", sessionSchema),
  SessionRegistration: mongoose.model("SessionRegistration", sessionRegistrationSchema),
  Booth: mongoose.model("Booth", boothSchema),
  Review: mongoose.model("Review", reviewSchema),
  Notification: mongoose.model("Notification", notificationSchema),
};
