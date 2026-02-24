const express = require("express");
const router = express.Router();
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const { protect, authorize } = require("../middleware/authMiddleware");

// Generate a unique receipt number
const generateReceiptNumber = () => {
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `AGR-${datePart}-${random}`;
};

// @desc    Create a purchase (Product Manager buys from Farmer)
// @route   POST /api/purchases
router.post("/", protect, authorize("PRODUCT_MANAGER"), async (req, res) => {
    try {
        const { productId, paymentMethod } = req.body;

        const product = await Product.findById(productId).populate("seller", "name email");
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.sellerRole !== "FARMER") {
            return res.status(400).json({ message: "This product is not a farmer listing" });
        }

        const purchase = await Purchase.create({
            buyer: req.user._id,
            seller: product.seller._id,
            product: product._id,
            productName: product.name,
            amount: product.price,
            quantity: product.unit,
            paymentMethod,
            receiptNumber: generateReceiptNumber(),
            status: "Completed",
        });

        // Optionally mark product as sold (Out of Stock)
        product.status = "Out of Stock";
        await product.save();

        const populatedPurchase = await Purchase.findById(purchase._id)
            .populate("buyer", "name email")
            .populate("seller", "name email")
            .populate("product", "name image");

        res.status(201).json(populatedPurchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get purchases made by the logged-in Product Manager
// @route   GET /api/purchases/my-purchases
router.get("/my-purchases", protect, authorize("PRODUCT_MANAGER"), async (req, res) => {
    try {
        const purchases = await Purchase.find({ buyer: req.user._id })
            .populate("seller", "name email")
            .populate("product", "name image")
            .sort({ createdAt: -1 });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get sales received by the logged-in Farmer
// @route   GET /api/purchases/my-sales
router.get("/my-sales", protect, authorize("FARMER"), async (req, res) => {
    try {
        const sales = await Purchase.find({ seller: req.user._id })
            .populate("buyer", "name email")
            .populate("product", "name image")
            .sort({ createdAt: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
