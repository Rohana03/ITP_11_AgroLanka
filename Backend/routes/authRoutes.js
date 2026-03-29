const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  const { name, email, nic, phone, password, role, assignedAsc, specialization, serviceDistricts } = req.body;

  try {
    // ─── Required field check ───
    if (!name || !email || !nic || !password) {
      return res.status(400).json({ message: "Please fill in all required fields (name, email, NIC, password)." });
    }

    // ─── Email format ───
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    // ─── NIC format (old: 9 digits + V/X, new: 12 digits) ───
    const nicCleaned = nic.trim().toUpperCase();
    const nicOld = /^\d{9}[VX]$/;
    const nicNew = /^\d{12}$/;
    if (!nicOld.test(nicCleaned) && !nicNew.test(nicCleaned)) {
      return res.status(400).json({ message: "Invalid NIC. Use old format (9 digits + V/X) or new 12-digit format." });
    }

    // ─── Password strength ───
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one number." });
    }

    // ─── Phone format (optional field) ───
    if (phone) {
      const phoneDigits = phone.replace(/[\s\-]/g, '');
      const phoneRe = /^(\+94|94)?0?7\d{8}$/;
      if (!phoneRe.test(phoneDigits)) {
        return res.status(400).json({ message: "Invalid phone number. Use Sri Lanka format (e.g. 0712345678)." });
      }
    }

    // Regex escape function for safety
    const escapeRegex = (string) => string.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');

    // Check if user exists (case-insensitive)
    const userExists = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') } 
    });
    const nicExists = await User.findOne({ nic: nicCleaned });

    if (userExists) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    if (nicExists) {
      return res.status(400).json({ message: "An account with this NIC already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      nic: nicCleaned,
      phone: phone || "",
      password: hashedPassword,
      role: role || 'FARMER',
      assignedAsc: assignedAsc || null,
      specialization: specialization || null,
      serviceDistricts: serviceDistricts || []
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        nic: user.nic,
        phone: user.phone,
        role: user.role,
        assignedAsc: user.assignedAsc,
        specialization: user.specialization,
        serviceDistricts: user.serviceDistricts,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Could not create account. Please check your details and try again." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // ─── Basic validation ───
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    // Regex escape function for safety
    const escapeRegex = (string) => string.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');

    // Case-insensitive search to support legacy mixed-case emails
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') } 
    }).populate('assignedAsc', 'name district');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedAsc: user.assignedAsc,
        specialization: user.specialization,
        serviceDistricts: user.serviceDistricts,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Incorrect email or password. Please try again." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('assignedAsc', 'name district');
  res.json(user);
});

// @desc    Update user's service districts
// @route   PUT /api/auth/update-districts
// @access  Private
router.put("/update-districts", protect, async (req, res) => {
  try {
    const { serviceDistricts } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.serviceDistricts = serviceDistricts || [];
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("assignedAsc", "name district");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user's assigned ASC
// @route   PUT /api/auth/update-asc
// @access  Private
router.put("/update-asc", protect, async (req, res) => {
  try {
    const { assignedAsc } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.assignedAsc = assignedAsc || null;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("assignedAsc", "name district");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile (phone, name etc)
// @route   PUT /api/auth/update-profile
// @access  Private
router.put("/update-profile", protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("assignedAsc", "name district");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TEMP: create admin
router.post("/create-admin", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("Admin123", 10);

    const admin = await User.create({
      name: "System Admin",
      email: "AdminAgroLanka@gmail.com",
      nic: "999999999V", // Dummy NIC for admin
      password: hashedPassword,
      role: "ADMIN"
    });

    res.json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
