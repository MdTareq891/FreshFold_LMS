const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken, authRequired } = require("../auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: bcrypt.hashSync(password, 8),
      role: "customer",
      phone: phone || "",
      address: address || "",
    });
    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user) });
});

// Update preferred UI language (persisted per-account)
router.patch("/language", authRequired, async (req, res) => {
  const { language } = req.body;
  if (!["en", "bn"].includes(language)) return res.status(400).json({ error: "language must be 'en' or 'bn'" });
  const user = await User.findByIdAndUpdate(req.user.id, { language }, { new: true });
  res.json({ user: safeUser(user) });
});

function safeUser(u) {
  const obj = u.toObject ? u.toObject() : u;
  const { passwordHash, pushSubscriptions, ...rest } = obj;
  return { ...rest, id: obj._id };
}

module.exports = router;
