const express = require("express");
const Service = require("../models/Service");
const { authRequired, requireRole } = require("../auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const services = await Service.find().sort({ createdAt: 1 });
  res.json({ services });
});

router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  const { name, pricePerItem, category } = req.body;
  if (!name || pricePerItem == null) return res.status(400).json({ error: "name and pricePerItem are required" });
  const service = await Service.create({ name, pricePerItem: Number(pricePerItem), category: category || "General" });
  res.status(201).json({ service });
});

router.put("/:id", authRequired, requireRole("admin"), async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!service) return res.status(404).json({ error: "Service not found" });
  res.json({ service });
});

router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
