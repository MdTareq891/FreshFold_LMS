const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  serviceId: String,
  name: String,
  qty: Number,
  price: Number,
  lineTotal: Number,
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: String,
  at: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true },
  receiptToken: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: String,
  items: [orderItemSchema],
  total: Number,
  status: {
    type: String,
    enum: ["Pending", "Scheduled", "Received", "In Process", "Checked", "Ready", "Completed"],
    default: "Pending",
  },
  pickupDate: String,
  address: String,
  note: { type: String, default: "" },
  notePhotos: { type: [String], default: [] }, // Cloudinary URLs
  paid: { type: Boolean, default: false },
  paidAt: Date,
  statusHistory: { type: [statusHistorySchema], default: [] },
  // Confirmation handshake: staff requests to move to a status, customer must confirm before it applies
  awaitingConfirmation: { type: Boolean, default: false },
  confirmationStatus: { type: String, default: null },
  confirmationRequestedAt: Date,
  confirmationCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
