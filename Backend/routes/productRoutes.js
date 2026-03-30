const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, authorize } = require("../middleware/authMiddleware");

// @desc    Get products available in user's region (Farmer/Public)
// @route   GET /api/products/available
router.get("/available", protect, async (req, res) => {
    try {
        const user = req.user;
        let query = { status: "Active" };

        if (user.role === 'FARMER') {
            let district = user.assignedAsc?.district;
            
            // Debugging: If population failed, assignedAsc might be a string ID
            if (!district && typeof user.assignedAsc === 'string') {
                const User = require("../models/User"); // Re-import to be safe
                const populatedUser = await User.findById(user._id).populate('assignedAsc');
                district = populatedUser.assignedAsc?.district;
            }

            console.log(`[ProductAPI] Role: FARMER, User: ${user.name}, District: ${district}`);
            
            if (!district) {
                console.warn(`[ProductAPI] Farmer ${user.name} has no detected district. assignedAsc:`, user.assignedAsc);
                return res.json([]);
            }

            // More lenient matching for districts array
            query = {
                ...query,
                districts: { $in: [district, district.toLowerCase(), district.toUpperCase(), new RegExp(`^${district}$`, 'i')] }
            };
        } else if (user.role === 'PRODUCT_MANAGER') {
            const districts = user.serviceDistricts;
            if (!districts || districts.length === 0) return res.json([]);
            query = {
                ...query,
                districts: { $in: districts },
                sellerRole: 'FARMER'
            };
        }

        console.log(`[ProductAPI] Final MongoDB Query:`, JSON.stringify(query));
        
        const products = await Product.find(query)
            .populate("seller", "name email")
            .populate("manager", "name email");

        console.log(`[ProductAPI] Products Found: ${products.length}`);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get manager's own listings
// @route   GET /api/products/my-listings
router.get("/my-listings", protect, authorize("PRODUCT_MANAGER", "FARMER"), async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id })
            .populate("seller", "name email");
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new product listing
// @route   POST /api/products
router.post("/", protect, authorize("PRODUCT_MANAGER", "FARMER"), async (req, res) => {
    try {
        const { name, category, description, price, unit, image } = req.body;
        const user = req.user;

        // ─── Field validation ───
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Product name is required." });
        }
        if (name.trim().length > 100) {
            return res.status(400).json({ message: "Product name must be 100 characters or fewer." });
        }
        if (!price || isNaN(Number(price)) || Number(price) <= 0) {
            return res.status(400).json({ message: "Price must be a positive number." });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ message: "Product description is required." });
        }
        if (!unit || !unit.trim()) {
            return res.status(400).json({ message: "Unit is required (e.g. kg, pack, 500ml)." });
        }

        let districts = [];
        if (user.role === 'PRODUCT_MANAGER') {
            districts = user.serviceDistricts;
        } else if (user.role === 'FARMER') {
            // Auth middleware already populates assignedAsc
            districts = [user.assignedAsc?.district];
        }

        if (!districts || districts.length === 0 || !districts[0]) {
            return res.status(400).json({ message: "You must have a district assigned to list products." });
        }

        // Regulated categories only for PMs (though Farmers listing crops shouldn't usually hit these)
        const regulatedCategories = ["Animal Health & Nutrition", "Crop Protection", "Crop Nutrients"];
        const status = (user.role === 'PRODUCT_MANAGER' && regulatedCategories.includes(category)) ? "Pending" : "Active";

        const product = await Product.create({
            name: name.trim(),
            category,
            description: description.trim(),
            price: Number(price),
            unit: unit.trim(),
            districts,
            seller: user._id,
            sellerRole: user.role,
            image,
            status
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// @desc    Get all pending products (Admin)
// @route   GET /api/products/pending
router.get("/pending", protect, authorize("ADMIN"), async (req, res) => {
    try {
        const products = await Product.find({ status: "Pending" }).populate("seller", "name email");
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Review/Approve a product listing
// @route   PUT /api/products/:id/review
router.put("/:id/review", protect, authorize("ADMIN"), async (req, res) => {
    try {
        const { status } = req.body;
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
router.delete("/:id", protect, authorize("PRODUCT_MANAGER", "FARMER"), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check ownership
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized to delete this product" });
        }

        await product.deleteOne();
        res.json({ message: "Product removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
