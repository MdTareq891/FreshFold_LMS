const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { authRequired, requireRole } = require("../auth");

const router = express.Router();

router.get("/", authRequired, requireRole("admin"), async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;
  const users = await User.find(query).select("-passwordHash -pushSubscriptions").sort({ createdAt: -1 });
  res.json({ users });
});

router.post("/staff", authRequired, requireRole("admin"), async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "Email already registered" });
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 8),
    role: "staff",
    phone: phone || "",
  });
  const obj = user.toObject();
  delete obj.passwordHash;
  delete obj.pushSubscriptions;
  res.status(201).json({ user: obj });
});

router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.role === "admin") return res.status(400).json({ error: "Admin accounts cannot be removed here" });
  if (target.id === req.user.id) return res.status(400).json({ error: "You cannot remove your own account" });
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
