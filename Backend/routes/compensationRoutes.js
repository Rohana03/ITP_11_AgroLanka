const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Compensation = require("../models/Compensation");
const { protect, authorize } = require("../middleware/authMiddleware");

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/compensation/";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error("Only images and PDFs are allowed!"));
        }
    }
});

// @desc    Submit a new compensation claim
// @route   POST /api/compensation
// @access  Private (Farmer only)
router.post("/", protect, authorize("FARMER"), upload.array("evidenceFiles", 5), async (req, res) => {
    try {
        const { crop, damageType, incidentDate, affectedArea, damageDescription, asc } = req.body;

        if (!crop || !damageType || !incidentDate || !affectedArea || !damageDescription || !asc) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const evidenceFiles = req.files ? req.files.map(file => file.path) : [];

        const claim = await Compensation.create({
            farmer: req.user._id,
            crop,
            damageType,
            incidentDate,
            affectedArea,
            damageDescription,
            evidenceFiles,
            asc
        });

        res.status(201).json({ message: "Compensation claim submitted successfully!", claim });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all compensation claims (for officers or farmers)
// @route   GET /api/compensation
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === "FARMER") {
            query.farmer = req.user._id;
        } else if (req.user.role === "FINANCIAL_OFFICER" || req.user.role === "ASC_OFFICER") {
            // Filter by officer's ASC
            if (req.user.assignedAsc) {
                query.asc = req.user.assignedAsc;
            }
        }

        const claims = await Compensation.find(query)
            .populate("farmer", "name email nic")
            .populate("crop", "cropType variety")
            .populate("asc", "name");

        res.json(claims);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update compensation claim (Estimation and Status)
// @route   PATCH /api/compensation/:id
// @access  Private (Officer only)
router.patch("/:id", protect, authorize("FINANCIAL_OFFICER", "ASC_OFFICER"), async (req, res) => {
    try {
        const { status, estimatedLoss } = req.body;

        const claim = await Compensation.findById(req.params.id);
        if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
        }

        // Check if officer belongs to the same ASC
        const officerAscId = req.user.assignedAsc?._id || req.user.assignedAsc;
        if (claim.asc.toString() !== officerAscId.toString()) {
            return res.status(403).json({ message: "Not authorized to update claims for other ASC centers" });
        }

        if (status) claim.status = status;
        if (estimatedLoss !== undefined) claim.estimatedLoss = estimatedLoss;

        await claim.save();
        res.json({ message: "Claim updated successfully!", claim });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
