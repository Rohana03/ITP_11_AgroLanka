const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
    {
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        quantity: {
            type: String,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["Card", "Bank Transfer"],
            required: true,
        },
        receiptNumber: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ["Completed", "Pending", "Refunded"],
            default: "Completed",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
