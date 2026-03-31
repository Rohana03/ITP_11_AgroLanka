const express = require("express");
const router = express.Router();
const Crop = require("../models/Crop");
const { protect, authorize } = require("../middleware/authMiddleware");

// @desc    Register a new crop
// @route   POST /api/crops
// @access  Private (Farmer only)
router.post("/", protect, authorize("FARMER"), async (req, res) => {
    try {
        const {
            cropType,
            variety,
            landSize,
            plantingDate,
            expectedHarvest,
            location,
            soilType,
            assignedAsc,
            season
        } = req.body;

        // ─── Validation Guards ───
        if (!cropType) return res.status(400).json({ message: "Crop type is required." });
        if (!variety || !variety.trim()) return res.status(400).json({ message: "Variety is required." });
        if (!landSize || isNaN(parseFloat(landSize)) || parseFloat(landSize) <= 0) {
            return res.status(400).json({ message: "Land size must be a positive number." });
        }
        if (!location) return res.status(400).json({ message: "Location is required." });
        if (!soilType) return res.status(400).json({ message: "Soil type is required." });
        if (!assignedAsc) return res.status(400).json({ message: "Assigned ASC is required." });

        // Rice-specific validation
        if (cropType === 'rice' && (!season || season === 'N/A' || !['Yala', 'Maha'].includes(season))) {
            return res.status(400).json({ message: "Please select a valid season (Yala or Maha) for rice." });
        }

        const crop = await Crop.create({
            farmer: req.user._id,
            cropType,
            variety: variety.trim(),
            landSize: parseFloat(landSize),
            plantingDate,
            expectedHarvest,
            location,
            soilType,
            assignedAsc,
            season: season || "N/A"
        });

        res.status(201).json(crop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all crops (Admin or localized to ASC for officers)
// @route   GET /api/crops
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === "FARMER") {
            query.farmer = req.user._id;
        } else if (req.user.role === "CROP_OFFICER" || req.user.role === "ASC_OFFICER") {
            // Filter by the officer's assigned ASC
            if (!req.user.assignedAsc) {
                return res.status(400).json({ message: "Officer not assigned to any ASC" });
            }
            query.assignedAsc = req.user.assignedAsc;

            // Further filter by specialization mappings
            const specializationMap = {
                "Paddy": "rice",
                "Vegetables": "vegetables",
                "Fruits": "fruits",
                "Spices": "spices",
                "Tea": "tea",
                "Coconut": "coconut",
                "Rubber": "rubber",
                "Coffee": "coffee",
                "Other": "other"
            };

            if (req.user.specialization && specializationMap[req.user.specialization]) {
                query.cropType = specializationMap[req.user.specialization];
            }
        }

        const crops = await Crop.find(query)
            .populate("farmer", "name email nic")
            .populate("assignedAsc", "name district");

        res.json(crops);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update crop registration status
// @route   PATCH /api/crops/:id/status
// @access  Private (Officer only)
router.patch("/:id/status", protect, authorize("CROP_OFFICER", "ASC_OFFICER"), async (req, res) => {
    try {
        const { status } = req.body;
        if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const crop = await Crop.findById(req.params.id);
        if (!crop) {
            return res.status(404).json({ message: "Crop not found" });
        }

        // Check if officer belongs to the same ASC as the crop
        const officerAscId = req.user.assignedAsc?._id || req.user.assignedAsc;
        if (crop.assignedAsc.toString() !== officerAscId.toString()) {
            return res.status(403).json({ message: "Not authorized to update crops in other ASC centers" });
        }

        crop.status = status;
        await crop.save();

        res.json(crop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get a single crop by ID
// @route   GET /api/crops/:id
// @access  Private (Farmer or authorized officer)
router.get("/:id", protect, async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id)
            .populate("farmer", "name email nic")
            .populate("assignedAsc", "name district");

        if (!crop) {
            return res.status(404).json({ message: "Crop not found" });
        }

        // Check authorization: if user is farmer, they must own it
        if (req.user.role === "FARMER" && crop.farmer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to access this crop" });
        }
        res.json(crop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a crop registration
// @route   PUT /api/crops/:id
// @access  Private (Farmer only)
router.put("/:id", protect, authorize("FARMER"), async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id);

        if (!crop) {
            return res.status(404).json({ message: "Crop not found" });
        }

        // Only the farmer who created the crop can update it
        if (crop.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this crop" });
        }

        const {
            cropType,
            variety,
            landSize,
            plantingDate,
            expectedHarvest,
            location,
            soilType,
            assignedAsc,
            season
        } = req.body;

        // Validation Guards
        if (!cropType) return res.status(400).json({ message: "Crop type is required." });
        if (!variety || !variety.trim()) return res.status(400).json({ message: "Variety is required." });
        if (!landSize || isNaN(parseFloat(landSize)) || parseFloat(landSize) <= 0) {
            return res.status(400).json({ message: "Land size must be a positive number." });
        }
        if (!location) return res.status(400).json({ message: "Location is required." });
        if (!soilType) return res.status(400).json({ message: "Soil type is required." });
        if (!assignedAsc) return res.status(400).json({ message: "Assigned ASC is required." });
        if (cropType === 'rice' && (!season || season === 'N/A' || !['Yala', 'Maha'].includes(season))) {
            return res.status(400).json({ message: "Please select a valid season (Yala or Maha) for rice." });
        }

        // Update fields
        crop.cropType = cropType;
        crop.variety = variety.trim();
        crop.landSize = parseFloat(landSize);
        if (plantingDate) crop.plantingDate = plantingDate;
        if (expectedHarvest) crop.expectedHarvest = expectedHarvest;
        crop.location = location;
        crop.soilType = soilType;
        crop.assignedAsc = assignedAsc;
        crop.season = season || "N/A";
        
        // Reset status to pending so officer can review the updated crop
        crop.status = "PENDING";

        await crop.save();

        res.json(crop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
