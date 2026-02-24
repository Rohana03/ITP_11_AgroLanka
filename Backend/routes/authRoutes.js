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
  const { name, email, nic, password, role, assignedAsc, specialization } = req.body;

  try {
    if (!name || !email || !nic || !password) {
      return res.status(400).json({ message: "Please add all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    const nicExists = await User.findOne({ nic });

    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    if (nicExists) {
      return res.status(400).json({ message: "User already exists with this NIC" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      nic,
      password: hashedPassword,
      role: role || 'FARMER', // Default role
      assignedAsc: assignedAsc || null,
      specialization: specialization || null
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        nic: user.nic,
        role: user.role,
        assignedAsc: user.assignedAsc,
        specialization: user.specialization,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email }).populate('assignedAsc', 'name district');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedAsc: user.assignedAsc,
        specialization: user.specialization,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('assignedAsc', 'name district');
  res.json(user);
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
