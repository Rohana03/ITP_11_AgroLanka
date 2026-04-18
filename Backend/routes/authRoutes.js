const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// TEMP: create admin
router.post("/create-admin", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      name: "System Admin",
      email: "admin@agrolanka.lk",
      password: hashedPassword,
      role: "ADMIN"
    });

    res.json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
