const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const GlobalSettings = require("../models/GlobalSettings");
const Loan = require("../models/Loan");
const Repayment = require("../models/Repayment");
const { protect, authorize } = require("../middleware/authMiddleware");

// Configure Multer for Repayment Receipts
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/repayments/";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error("Only images and PDFs are allowed!"));
    }
});

// Get current interest rate
router.get("/interest-rate", async (req, res) => {
    try {
        let rate = await GlobalSettings.findOne({ key: "LOAN_INTEREST_RATE" });
        if (!rate) {
            rate = await GlobalSettings.create({ key: "LOAN_INTEREST_RATE", value: 8 });
        }
        res.json({ rate: rate.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update interest rate
router.patch("/interest-rate", protect, authorize("FINANCIAL_OFFICER", "ADMIN"), async (req, res) => {
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
router.post("/apply", protect, authorize("FARMER"), async (req, res) => {
    try {
        const { loanAmount, repaymentPeriod, interestRate, purpose, collateral, termsAccepted, asc } = req.body;

        if (!termsAccepted) {
            return res.status(400).json({ message: "Terms and conditions must be accepted." });
        }

        // Calculate EMI and Total Payable
        const P = parseFloat(loanAmount);
        const r = (parseFloat(interestRate) / 100) / 12;
        const n = parseInt(repaymentPeriod);
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayable = emi * n;

        const newLoan = new Loan({
            farmer: req.user._id,
            amount: loanAmount,
            repaymentPeriod,
            interestRate,
            purpose,
            collateral,
            termsAccepted,
            asc,
            monthlyInstallment: emi.toFixed(2),
            totalPayable: totalPayable.toFixed(2)
        });

        await newLoan.save();
        res.status(201).json({ message: "Loan application submitted successfully!", loan: newLoan });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get loans by ASC (for officers) or for specific farmer
router.get("/", protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === "FARMER") {
            query.farmer = req.user._id;
        } else {
            const ascId = req.query.ascId || req.user.assignedAsc?._id || req.user.assignedAsc;
            if (ascId) query.asc = ascId;
        }

        const loans = await Loan.find(query).populate('farmer', 'name email nic');

        // Add isOverdue logic dynamically
        const processedLoans = loans.map(loan => {
            const loanObj = loan.toObject();
            if (loan.status === 'APPROVED' && loan.nextPaymentDate && new Date() > new Date(loan.nextPaymentDate)) {
                loanObj.isOverdue = true;
            } else {
                loanObj.isOverdue = false;
            }
            return loanObj;
        });

        res.json(processedLoans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update loan status (Approval sets initial payment date)
router.patch("/:id/status", protect, authorize("FINANCIAL_OFFICER", "ADMIN"), async (req, res) => {
    try {
        const { status } = req.body;
        const update = { status };

        if (status === 'APPROVED') {
            update.approvedDate = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            update.nextPaymentDate = nextMonth;
        }

        const loan = await Loan.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(loan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Submit a repayment (Farmer)
router.post("/repayments", protect, authorize("FARMER"), upload.single("receipt"), async (req, res) => {
    try {
        const { loanId, amount } = req.body;
        if (!req.file) return res.status(400).json({ message: "Payment proof (bank slip) is required" });

        const repayment = await Repayment.create({
            loan: loanId,
            farmer: req.user._id,
            amount,
            receiptImage: req.file.path
        });

        res.status(201).json({ message: "Repayment proof submitted successfully!", repayment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all repayments (Officer or Farmer)
router.get("/repayments", protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === "FARMER") {
            query.farmer = req.user._id;
        } else {
            const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;
            // Get all repayments for loans in the officer's ASC
            const loansInAsc = await Loan.find({ asc: ascId }).select('_id');
            const loanIds = loansInAsc.map(l => l._id);
            query.loan = { $in: loanIds };
        }

        const repayments = await Repayment.find(query)
            .populate('farmer', 'name email nic')
            .populate('loan', 'amount totalPayable purpose nextPaymentDate')
            .sort({ createdAt: -1 });
        res.json(repayments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify or Reject repayment (Officer)
router.patch("/repayments/:id/verify", protect, authorize("FINANCIAL_OFFICER", "ADMIN"), async (req, res) => {
    try {
        const { status, adminNotes } = req.body; // VERIFIED or REJECTED
        const repayment = await Repayment.findById(req.params.id);
        if (!repayment) return res.status(404).json({ message: "Repayment record not found" });

        repayment.status = status;
        repayment.adminNotes = adminNotes;
        await repayment.save();

        if (status === 'VERIFIED') {
            const loan = await Loan.findById(repayment.loan);
            loan.totalPaid += repayment.amount;

            // Advance next payment date by 1 month
            const currentDue = loan.nextPaymentDate || new Date();
            const nextDue = new Date(currentDue);
            nextDue.setMonth(nextDue.getMonth() + 1);
            loan.nextPaymentDate = nextDue;

            await loan.save();
        }

        res.json({ message: `Repayment marked as ${status}`, repayment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
