const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

async function connectDB() {
  let uri = process.env.MONGO_URI && process.env.MONGO_URI.trim();
  if (!uri) {
    memoryServer = await MongoMemoryServer.create({
      instance: { launchTimeout: 120000 },
    });
    uri = memoryServer.getUri();
    console.log("Embedded MongoDB is running. Set MONGO_URI for a persistent database.");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = { connectDB };
