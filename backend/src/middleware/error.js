const { validationResult } = require("express-validator");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg });
  }
  next();
}

function notFound(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, _req, res, _next) {
  if (err.code === 11000) {
    return res.status(409).json({ message: "That record already exists." });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "That record could not be found." });
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)[0]?.message || "Check the form and try again.";
    return res.status(400).json({ message });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    message: status === 500 ? "Something went wrong. Please try again." : err.message,
  });
}

module.exports = { validate, notFound, errorHandler };
