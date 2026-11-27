const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectDB } = require("./config/db");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error");
const { seed } = require("./seed/seed");

const app = express();
const dist = path.join(__dirname, "../../frontend/dist");

let ready;
function ensureReady() {
  if (!ready) {
    ready = (async () => {
      try {
        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET is missing. Set it on the backend service.");
        }
        await connectDB();
      } catch (error) {
        ready = undefined;
        throw error;
      }
    })();
  }
  return ready;
}

app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use("/api", routes);

if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

async function start() {
  await ensureReady();
  if (process.env.SEED !== "false") await seed();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`EventSphere API listening on http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = app;
