const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Crop Protection",
                "Crop Nutrients",
                "Seeds & Planting Material",
                "Agri Equipment",
                "Animal Health & Nutrition",
                "Post-Harvest & Storage",
                "Irrigation & Water Management",
                "Home & Garden",
                "Other"
            ],
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            required: true, // e.g., 'kg', 'ltr', 'item', 'pack'
        },
        districts: {
            type: [String],
            required: true,
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sellerRole: {
            type: String,
            enum: ["PRODUCT_MANAGER", "FARMER"],
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Active", "Out of Stock", "Discontinued", "Rejected"],
            default: "Active",
        },
        image: {
            type: String, // Base64 string
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
