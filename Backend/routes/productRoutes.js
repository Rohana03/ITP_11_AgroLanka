const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, authorize } = require("../middleware/authMiddleware");

// @desc    Get products available in user's region (Farmer/Public)
// @route   GET /api/products/available
router.get("/available", protect, async (req, res) => {
    try {
        const user = req.user;
        if (!user.assignedAsc && (!user.serviceDistricts || user.serviceDistricts.length === 0)) {
            // If no district assigned, maybe return all or none. 
            // For Farmers, they usually have assignedAsc.
        }

        let districtFilter = {};
        if (user.role === 'FARMER' && user.assignedAsc) {
            // We need to populate assignedAsc to get the district
            const populatedUser = await user.populate('assignedAsc', 'district');
            const district = populatedUser.assignedAsc.district;
            districtFilter = { districts: district };
        } else if (user.role === 'PRODUCT_MANAGER') {
            districtFilter = { manager: user._id };
        }

        const products = await Product.find({ ...districtFilter, status: "Active" })
            .populate("manager", "name email");

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all products (for testing/admin)
// @route   GET /api/products
router.get("/", protect, async (req, res) => {
    try {
        const products = await Product.find().populate("manager", "name email");
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new product listing
// @route   POST /api/products
router.post("/", protect, authorize("PRODUCT_MANAGER"), async (req, res) => {
    try {
        const { name, category, description, price, unit, image } = req.body;

        // Auto-assign districts from Product Manager's profile
        const districts = req.user.serviceDistricts;

        if (!districts || districts.length === 0) {
            return res.status(400).json({ message: "You must have service districts assigned to your profile to list products." });
        }

        // Regulated categories that require admin approval
        const regulatedCategories = ["Animal Health & Nutrition", "Crop Protection", "Crop Nutrients"];
        const status = regulatedCategories.includes(category) ? "Pending" : "Active";

        const product = await Product.create({
            name,
            category,
            description,
            price,
            unit,
            districts,
            manager: req.user._id,
            image,
            status
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all pending products (Admin)
// @route   GET /api/products/pending
router.get("/pending", protect, authorize("ADMIN"), async (req, res) => {
    try {
        const products = await Product.find({ status: "Pending" }).populate("manager", "name email");
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Review/Approve a product listing
// @route   PUT /api/products/:id/review
router.put("/:id/review", protect, authorize("ADMIN"), async (req, res) => {
    try {
        const { status } = req.body; // 'Active' or 'Rejected'
        if (!['Active', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        product.status = status;
        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a product listing
// @route   DELETE /api/products/:id
router.delete("/:id", protect, authorize("PRODUCT_MANAGER"), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check ownership
        if (product.manager.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized to delete this product" });
        }

        await product.deleteOne();
        res.json({ message: "Product removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
