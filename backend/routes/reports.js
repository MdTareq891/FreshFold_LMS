const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const { authRequired, requireRole } = require("../auth");

const router = express.Router();

router.get("/summary", authRequired, requireRole("admin", "staff"), async (req, res) => {
  const orders = await Order.find();
  const totalCustomers = await User.countDocuments({ role: "customer" });

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "Completed").length;
  const pendingOrders = orders.filter((o) => o.status !== "Completed").length;
  const totalRevenue = orders.filter((o) => o.paid).reduce((sum, o) => sum + o.total, 0);
  const outstanding = orders.filter((o) => !o.paid).reduce((sum, o) => sum + o.total, 0);

  const byStatus = {};
  orders.forEach((o) => {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  });

  const serviceCounts = {};
  orders.forEach((o) => {
    o.items.forEach((it) => {
      serviceCounts[it.name] = (serviceCounts[it.name] || 0) + it.qty;
    });
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  res.json({
    totalOrders,
    completedOrders,
    pendingOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    outstanding: Math.round(outstanding * 100) / 100,
    totalCustomers,
    byStatus,
    topServices,
  });
});

module.exports = router;
