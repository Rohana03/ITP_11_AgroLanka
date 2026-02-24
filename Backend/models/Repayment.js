const mongoose = require("mongoose");

const repaymentSchema = new mongoose.Schema(
    {
        loan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Loan',
            required: true
        },
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        receiptImage: {
            type: String, // Path to uploaded bank slip
            required: true
        },
        status: {
            type: String,
            enum: ["PENDING", "VERIFIED", "REJECTED"],
            default: "PENDING"
        },
        paymentDate: {
            type: Date,
            default: Date.now
        },
        adminNotes: {
            type: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Repayment", repaymentSchema);
