const express = require("express");
const Inventory = require("../models/Inventory");
const { authRequired, requireRole } = require("../auth");

const router = express.Router();

router.get("/", authRequired, requireRole("admin", "staff"), async (req, res) => {
  const inventory = await Inventory.find().sort({ createdAt: 1 });
  res.json({ inventory });
});

router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  const { name, quantity, unit, threshold } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const item = await Inventory.create({
    name,
    quantity: Number(quantity) || 0,
    unit: unit || "units",
    threshold: Number(threshold) || 0,
  });
  res.status(201).json({ item });
});

router.patch("/:id", authRequired, requireRole("admin", "staff"), async (req, res) => {
  const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ error: "Item not found" });
  res.json({ item });
});

router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  await Inventory.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
