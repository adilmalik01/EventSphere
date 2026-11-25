const QRCode = require("qrcode");

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function slugify(value) {
  const base = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "event"}-${Math.random().toString(36).slice(2, 6)}`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ticketCode() {
  const left = Math.random().toString(36).slice(2, 6).toUpperCase();
  const right = Date.now().toString(36).slice(-4).toUpperCase();
  return `ES-${left}-${right}`;
}

function paymentReference() {
  return `DEMO-${Date.now().toString(36).toUpperCase()}`;
}

async function withQr(booking) {
  const plain = booking.toObject ? booking.toObject() : { ...booking };
  plain.qr = await QRCode.toDataURL(plain.ticketCode, {
    margin: 1,
    width: 280,
    color: { dark: "#1c1915", light: "#faf7f2" },
  });
  return plain;
}

const BOOTH_PRICES = { "3x3": 45000, "3x6": 80000, "6x6": 140000 };

module.exports = {
  AppError,
  asyncHandler,
  slugify,
  escapeRegex,
  ticketCode,
  paymentReference,
  withQr,
  BOOTH_PRICES,
};
