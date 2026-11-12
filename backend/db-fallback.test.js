const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const connectDB = require("./db");

test("connectDB should fall back to an in-memory MongoDB when the configured URI is invalid", async () => {
  process.env.MONGODB_URI = "mongodb://bad.invalid:27017/freshfold";

  await connectDB();
  assert.equal(mongoose.connection.readyState, 1);

  await mongoose.disconnect();
});
