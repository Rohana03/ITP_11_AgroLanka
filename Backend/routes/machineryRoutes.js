const express = require("express");
const router = express.Router();
const Machinery = require("../models/Machinery");
const MachineryRequest = require("../models/MachineryRequest");
const ServiceRequest = require("../models/ServiceRequest");
const FarmerMachinery = require("../models/FarmerMachinery");
const { protect, authorize } = require("../middleware/authMiddleware");

// --- Farmer Routes ---

// @desc    Get all available machinery in ASC
// @route   GET /api/machinery/available
router.get("/available", protect, async (req, res) => {
    try {
        const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;
        if (!ascId) return res.status(400).json({ message: "No ASC assigned to user" });

        const machinery = await Machinery.find({ asc: ascId, status: "Available" });
        res.json(machinery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Request machinery from ASC
// @route   POST /api/machinery/requests
router.post("/requests", protect, authorize("FARMER"), async (req, res) => {
    try {
        const { machineryId, requestDate, duration, location, landSize, additionalNotes } = req.body;
        const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;

        // ─── Validation ───
        if (!machineryId) {
            return res.status(400).json({ message: "Please select a machinery item." });
        }
        if (!requestDate) {
            return res.status(400).json({ message: "Request date is required." });
        }
        if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
            return res.status(400).json({ message: "Duration must be a positive number of days." });
        }
        if (!location || !location.trim()) {
            return res.status(400).json({ message: "Location / field address is required." });
        }

        const machineryRequest = await MachineryRequest.create({
            farmer: req.user._id,
            machinery: machineryId,
            requestDate,
            duration,
            location: location.trim(),
            landSize,
            asc: ascId,
            additionalNotes
        });

        res.status(201).json({ message: "Machinery request submitted successfully!", machineryRequest });
    } catch (error) {
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// @desc    Request agricultural service
// @route   POST /api/machinery/services
router.post("/services", protect, authorize("FARMER"), async (req, res) => {
    try {
        const { serviceType, requestDate, location, description } = req.body;
        const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;

        // ─── Validation ───
        if (!serviceType || !serviceType.trim()) {
            return res.status(400).json({ message: "Service type is required." });
        }
        if (!requestDate) {
            return res.status(400).json({ message: "Request date is required." });
        }
        if (!location || !location.trim()) {
            return res.status(400).json({ message: "Location is required." });
        }

        const serviceRequest = await ServiceRequest.create({
            farmer: req.user._id,
            serviceType: serviceType.trim(),
            requestDate,
            location: location.trim(),
            description,
            asc: ascId
        });

        res.status(201).json({ message: "Service request submitted successfully!", serviceRequest });
    } catch (error) {
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// @desc    Rent out personal machinery (Farmer)
// @route   POST /api/machinery/rent-out
router.post("/rent-out", protect, authorize("FARMER"), async (req, res) => {
    try {
        const { machineryType, description, rentPerDay, contactNumber } = req.body;
        const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;

        // ─── Validation ───
        if (!machineryType || !machineryType.trim()) {
            return res.status(400).json({ message: "Machinery type is required." });
        }
        if (!rentPerDay || isNaN(Number(rentPerDay)) || Number(rentPerDay) <= 0) {
            return res.status(400).json({ message: "Rent per day must be a positive number." });
        }
        if (!contactNumber || !contactNumber.trim()) {
            return res.status(400).json({ message: "Contact number is required." });
        }

        const rental = await FarmerMachinery.create({
            farmer: req.user._id,
            machineryType: machineryType.trim(),
            description,
            rentPerDay: Number(rentPerDay),
            contactNumber: contactNumber.trim(),
            asc: ascId
        });

        res.status(201).json({ message: "Machinery listed for rent successfully!", rental });
    } catch (error) {
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// @desc    Get farmer's own history (Requests and Listings)
// @route   GET /api/machinery/my-history
router.get("/my-history", protect, authorize("FARMER"), async (req, res) => {
    try {
        const [machineryRequests, serviceRequests, myRentals] = await Promise.all([
            MachineryRequest.find({ farmer: req.user._id }).populate("machinery", "name type"),
            ServiceRequest.find({ farmer: req.user._id }),
            FarmerMachinery.find({ farmer: req.user._id })
        ]);

        res.json({ machineryRequests, serviceRequests, myRentals });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get community rentals in farmer's ASC area (excluding their own)
// @route   GET /api/machinery/community-rentals
router.get("/community-rentals", protect, authorize("FARMER"), async (req, res) => {
    try {
        const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;
        if (!ascId) {
            return res.status(400).json({ message: "Please select an ASC center in your profile first." });
        }

        const rentals = await FarmerMachinery.find({
            asc: ascId,
            status: "Available",
            farmer: { $ne: req.user._id }
        }).populate("farmer", "name email");

        res.json(rentals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Officer Routes ---

// @desc    Get all regional requests and rentals (Machinery Officer)
// @route   GET /api/machinery/regional-data
router.get("/regional-data", protect, authorize("MACHINERY_OFFICER", "ASC_OFFICER"), async (req, res) => {
    try {
        const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;
        if (!ascId) return res.status(400).json({ message: "No ASC assigned to officer" });

        const [machineryRequests, serviceRequests, farmerRentals, inventory] = await Promise.all([
            MachineryRequest.find({ asc: ascId }).populate("farmer", "name email nic").populate("machinery", "name type"),
            ServiceRequest.find({ asc: ascId }).populate("farmer", "name email nic"),
            FarmerMachinery.find({ asc: ascId }).populate("farmer", "name email nic"),
            Machinery.find({ asc: ascId })
        ]);

        res.json({ machineryRequests, serviceRequests, farmerRentals, inventory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update machinery request status
// @route   PATCH /api/machinery/requests/:id
router.patch("/requests/:id", protect, authorize("MACHINERY_OFFICER", "ASC_OFFICER"), async (req, res) => {
    try {
        const { status } = req.body;
        const request = await MachineryRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        request.status = status;
        await request.save();

        res.json({ message: "Request status updated!", request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update service request status
// @route   PATCH /api/machinery/services/:id
router.patch("/services/:id", protect, authorize("MACHINERY_OFFICER", "ASC_OFFICER"), async (req, res) => {
    try {
        const { status } = req.body;
        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        request.status = status;
        await request.save();

        res.json({ message: "Service request updated!", request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Manage ASC machinery inventory
// @route   POST /api/machinery/inventory
router.post("/inventory", protect, authorize("MACHINERY_OFFICER", "ASC_OFFICER"), async (req, res) => {
    try {
        const { name, type, totalCount } = req.body;
        const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;

        // ─── Validation ───
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Machinery name is required." });
        }
        if (!type || !type.trim()) {
            return res.status(400).json({ message: "Machinery type is required." });
        }
        if (!totalCount || isNaN(Number(totalCount)) || Number(totalCount) < 1) {
            return res.status(400).json({ message: "Total count must be at least 1." });
        }

        const item = await Machinery.create({
            name: name.trim(),
            type: type.trim(),
            totalCount: Number(totalCount),
            availableCount: Number(totalCount),
            asc: ascId
        });

        res.status(201).json({ message: "Machinery added to inventory!", item });
    } catch (error) {
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// @desc    Update machinery inventory item (available count)
// @route   PATCH /api/machinery/inventory/:id
router.patch("/inventory/:id", protect, authorize("MACHINERY_OFFICER", "ASC_OFFICER"), async (req, res) => {
    try {
        const { availableCount } = req.body;
        const item = await Machinery.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (availableCount !== undefined) item.availableCount = availableCount;
        await item.save();
        res.json({ message: "Inventory updated!", item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete machinery inventory item
// @route   DELETE /api/machinery/inventory/:id
router.delete("/inventory/:id", protect, authorize("MACHINERY_OFFICER", "ASC_OFFICER"), async (req, res) => {
    try {
        const item = await Machinery.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });
        await item.deleteOne();
        res.json({ message: "Inventory item removed." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

