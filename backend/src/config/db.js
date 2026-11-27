const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

let connecting;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (connecting) return connecting;

  connecting = (async () => {
    let uri = process.env.MONGO_URI && process.env.MONGO_URI.trim();
    if (!uri) {
      if (process.env.VERCEL) {
        throw new Error("Set MONGO_URI on the backend service. Embedded MongoDB is for local runs only.");
      }
      memoryServer = await MongoMemoryServer.create({
        instance: { launchTimeout: 120000 },
      });
      uri = memoryServer.getUri();
      console.log("Embedded MongoDB is running. Set MONGO_URI for a persistent database.");
    }
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  })();

  try {
    await connecting;
  } finally {
    connecting = undefined;
  }
}

module.exports = { connectDB };
