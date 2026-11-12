const express = require("express");
const User = require("../models/User");
const { authRequired } = require("../auth");

const router = express.Router();

// Returns the VAPID public key so the frontend can subscribe
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// Save a browser's push subscription against the logged-in user
router.post("/subscribe", authRequired, async (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription object" });
  }
  const user = await User.findById(req.user.id);
  const already = user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
  if (!already) {
    user.pushSubscriptions.push(subscription);
    await user.save();
  }
  res.json({ ok: true });
});

router.post("/unsubscribe", authRequired, async (req, res) => {
  const { endpoint } = req.body;
  const user = await User.findById(req.user.id);
  user.pushSubscriptions = user.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
  await user.save();
  res.json({ ok: true });
});

module.exports = router;
