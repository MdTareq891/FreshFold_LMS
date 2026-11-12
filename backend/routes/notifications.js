const express = require("express");
const Notification = require("../models/Notification");
const { authRequired } = require("../auth");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ notifications });
});

router.delete("/", authRequired, async (req, res) => {
  const result = await Notification.deleteMany({ userId: req.user.id });
  res.json({ ok: true, deletedCount: result.deletedCount });
});

router.patch("/:id/read", authRequired, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ ok: true });
});

module.exports = router;
