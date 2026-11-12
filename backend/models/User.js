const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["customer", "staff", "admin"], default: "customer" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  language: { type: String, enum: ["en", "bn"], default: "en" },
  pushSubscriptions: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
