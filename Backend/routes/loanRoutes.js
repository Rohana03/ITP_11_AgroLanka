const express = require("express");
const router = express.Router();
const GlobalSettings = require("../models/GlobalSettings");
const Loan = require("../models/Loan");

// Get current interest rate
router.get("/interest-rate", async (req, res) => {
    try {
        let rate = await GlobalSettings.findOne({ key: "LOAN_INTEREST_RATE" });
        if (!rate) {
            // Default rate 8% if not found
            rate = await GlobalSettings.create({ key: "LOAN_INTEREST_RATE", value: 8 });
        }
        res.json({ rate: rate.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update interest rate (Ideally should have auth middleware, but keeping it simple for now as requested)
router.patch("/interest-rate", async (req, res) => {
    try {
        const { rate } = req.body;
        const updatedRate = await GlobalSettings.findOneAndUpdate(
            { key: "LOAN_INTEREST_RATE" },
            { value: rate },
            { new: true, upsert: true }
        );
        res.json({ rate: updatedRate.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Apply for loan
router.post("/apply", async (req, res) => {
    try {
        const { farmer, loanAmount, repaymentPeriod, interestRate, purpose, collateral, termsAccepted, asc } = req.body;

        if (!termsAccepted) {
            return res.status(400).json({ message: "Terms and conditions must be accepted." });
        }

        const newLoan = new Loan({
            farmer,
            amount: loanAmount, // Map loanAmount from frontend to amount in model
            repaymentPeriod,
            interestRate,
            purpose,
            collateral,
            termsAccepted,
            asc
        });

        await newLoan.save();
        res.status(201).json({ message: "Loan application submitted successfully!", loan: newLoan });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get loans by ASC (for officers)
router.get("/", async (req, res) => {
    try {
        const { ascId } = req.query;
        const loans = await Loan.find({ asc: ascId }).populate('farmer', 'name email nic');
        res.json(loans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update loan status
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const loan = await Loan.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(loan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
