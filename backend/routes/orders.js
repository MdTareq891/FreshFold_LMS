const express = require("express");
const crypto = require("crypto");
const Order = require("../models/Order");
const Service = require("../models/Service");
const User = require("../models/User");
const { authRequired, requireRole } = require("../auth");
const { notifyUser } = require("../services/notify");

const router = express.Router();

const STATUS_FLOW = ["Pending", "Scheduled", "Received", "In Process", "Checked", "Ready", "Completed"];
const FINAL_STATUS_NOTIFICATIONS = new Set(["Ready", "Completed"]);

function uid() {
  return crypto.randomUUID();
}

function getReadyOrDoneMessage(orderNo, status) {
  if (status === "Ready") return `Order ${orderNo}: Your order is ready for delivery/pickup!`;
  if (status === "Completed") return `Order ${orderNo}: Your order is complete. Thank you!`;
  return `Order ${orderNo}: status updated to ${status}.`;
}

module.exports = function ordersRouter(io) {
  // Create a new order (customer) — now accepts an optional note + notePhotos (Cloudinary URLs)
  router.post("/", authRequired, requireRole("customer"), async (req, res) => {
    try {
      const { items, pickupDate, address, note, notePhotos } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "At least one item/service is required" });
      }

      let total = 0;
      const resolvedItems = [];
      for (const it of items) {
        const service = await Service.findById(it.serviceId);
        if (!service) return res.status(400).json({ error: `Unknown service: ${it.serviceId}` });
        const qty = Number(it.qty) || 1;
        const lineTotal = service.pricePerItem * qty;
        total += lineTotal;
        resolvedItems.push({ serviceId: service.id, name: service.name, qty, price: service.pricePerItem, lineTotal });
      }

      const order = await Order.create({
        orderNo: "LMS-" + Date.now().toString().slice(-8),
        receiptToken: uid(),
        customerId: req.user.id,
        customerName: req.user.name,
        items: resolvedItems,
        total: Math.round(total * 100) / 100,
        status: "Pending",
        pickupDate: pickupDate || null,
        address: address || "",
        note: note || "",
        notePhotos: Array.isArray(notePhotos) ? notePhotos.slice(0, 6) : [],
        paid: false,
        statusHistory: [{ status: "Pending", at: new Date() }],
      });

      if (io) io.to("role:staff").to("role:admin").emit("order:new", { orderId: order._id });

      res.status(201).json({ order });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // List orders - customers see their own; staff/admin see all
  router.get("/", authRequired, async (req, res) => {
    const query = req.user.role === "customer" ? { customerId: req.user.id } : {};
    if (req.query.status) query.status = req.query.status;
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ orders });
  });

  // Public receipt lookup by token (no auth — used by QR code / receipt page)
  router.get("/receipt/:token", async (req, res) => {
    const order = await Order.findOne({ receiptToken: req.params.token });
    if (!order) return res.status(404).json({ error: "Receipt not found" });
    const { customerId, statusHistory, __v, ...safe } = order.toObject();
    res.json({ order: safe });
  });

  // Get single order
  router.get("/:id", authRequired, async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (req.user.role === "customer" && order.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({ order });
  });

  // Update order status (staff/admin only)
  router.patch("/:id/status", authRequired, requireRole("staff", "admin"), async (req, res) => {
    const { status } = req.body;
    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${STATUS_FLOW.join(", ")}` });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    order.statusHistory.push({ status, at: new Date() });
    await order.save();

    const customer = await User.findById(order.customerId);
    if (customer && FINAL_STATUS_NOTIFICATIONS.has(status)) {
      await notifyUser(io, customer, {
        message: getReadyOrDoneMessage(order.orderNo, status),
        emailSubject: `Order ${order.orderNo} — ${status}`,
      });
    }

    if (io) io.to(`order:${order._id}`).emit("order:updated", { orderId: order._id, status });

    res.json({ order });
  });

  // Staff/admin requests to move an order to its next status — does NOT change the
  // status yet. It just flags the order as "awaiting customer confirmation" and
  // notifies the customer, who must confirm before the status actually advances.
  router.patch("/:id/request-confirmation", authRequired, requireRole("staff", "admin"), async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const idx = STATUS_FLOW.indexOf(order.status);
    const next = req.body.status || STATUS_FLOW[idx + 1];
    if (!next || !STATUS_FLOW.includes(next)) {
      return res.status(400).json({ error: "There is no next status for this order" });
    }
    if (order.awaitingConfirmation) {
      return res.status(400).json({ error: "A confirmation request is already pending for this order" });
    }

    if (order.confirmationCompleted) {
      order.status = next;
      order.statusHistory.push({ status: next, at: new Date() });
      await order.save();

      const customer = await User.findById(order.customerId);
      if (customer && FINAL_STATUS_NOTIFICATIONS.has(next)) {
        await notifyUser(io, customer, {
          message: getReadyOrDoneMessage(order.orderNo, next),
          emailSubject: `Order ${order.orderNo} — ${next}`,
        });
      }

      if (io) io.to(`order:${order._id}`).emit("order:updated", { orderId: order._id, status: next });
      return res.json({ order });
    }

    order.awaitingConfirmation = true;
    order.confirmationStatus = next;
    order.confirmationRequestedAt = new Date();
    await order.save();

    const customer = await User.findById(order.customerId);
    if (customer) {
      const friendly = {
        Scheduled: "we'd like to schedule your pickup",
        Received: "we've received your items and are logging them in",
        "In Process": "we're ready to start processing (washing/cleaning) your order",
        Checked: "your order has passed quality check",
        Ready: "your order is ready for delivery/pickup",
        Completed: "your order is complete",
      };
      await notifyUser(io, customer, {
        message: `Order ${order.orderNo}: ${friendly[next] || `we'd like to update the status to ${next}`}. Please confirm in your dashboard to continue.`,
        emailSubject: `Action needed — confirm order ${order.orderNo}`,
      });
    }

    if (io) io.to(`order:${order._id}`).emit("order:updated", { orderId: order._id, awaitingConfirmation: true });

    res.json({ order });
  });

  // Customer confirms (or declines) a pending status-change request from staff.
  router.patch("/:id/confirm", authRequired, requireRole("customer"), async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!order.awaitingConfirmation || !order.confirmationStatus) {
      return res.status(400).json({ error: "There is nothing to confirm on this order" });
    }

    const approve = req.body.approve !== false;
    const nextStatus = order.confirmationStatus;

    order.awaitingConfirmation = false;
    order.confirmationStatus = null;
    order.confirmationRequestedAt = null;

    if (approve) {
      order.confirmationCompleted = true;
      order.status = nextStatus;
      order.statusHistory.push({ status: nextStatus, at: new Date() });
    }
    await order.save();

    const customer = await User.findById(order.customerId);
    if (approve && customer && FINAL_STATUS_NOTIFICATIONS.has(order.status)) {
      await notifyUser(io, customer, {
        message: getReadyOrDoneMessage(order.orderNo, order.status),
        emailSubject: `Order ${order.orderNo} — ${order.status}`,
      });
    }

    if (io) {
      io.to("role:staff").to("role:admin").emit("order:new", { orderId: order._id });
      io.to(`order:${order._id}`).emit("order:updated", { orderId: order._id, status: order.status, approve });
    }

    res.json({ order });
  });

  // Mark payment (staff/admin)
  router.patch("/:id/pay", authRequired, requireRole("staff", "admin"), async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    order.paid = true;
    order.paidAt = new Date();
    await order.save();

    res.json({ order });
  });

  router.STATUS_FLOW = STATUS_FLOW;
  return router;
};
