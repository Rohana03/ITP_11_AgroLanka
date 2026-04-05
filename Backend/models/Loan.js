const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    repaymentPeriod: {
        type: Number,
        required: true
    }, // in months
    interestRate: {
        type: Number,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    collateral: {
        type: String,
        required: true
    },
    asc: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ASC',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    termsAccepted: {
        type: Boolean,
        required: true
    },
    totalPaid: {
        type: Number,
        default: 0
    },
    totalPayable: {
        type: Number
    },
    monthlyInstallment: {
        type: Number
    },
    nextPaymentDate: {
        type: Date
    },
    approvedDate: {
        type: Date
    },
    loanDeadline: {
        type: Date
    },
    loanImage: {
        type: String,
        default: null
    },
    officerNotes: {
        type: String,
        default: null
    },
    officerMessage: {
        type: String,
        default: null
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Loan", loanSchema);
