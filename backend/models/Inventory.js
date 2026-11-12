const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: "units" },
  threshold: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Inventory", inventorySchema);
