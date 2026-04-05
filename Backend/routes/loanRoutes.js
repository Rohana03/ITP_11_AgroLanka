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

// Configure Multer for Loan Images
const loanImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/loans/";
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

const loanImageUpload = multer({
    storage: loanImageStorage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error("Only images are allowed!"));
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
router.post("/apply", protect, authorize("FARMER"), loanImageUpload.single("loanImage"), async (req, res) => {
    try {
        const { loanAmount, repaymentPeriod, interestRate, purpose, collateral, termsAccepted, asc } = req.body;

        // ─── Validation Guards ───
        if (!loanAmount || isNaN(parseFloat(loanAmount)) || parseFloat(loanAmount) < 1000) {
            return res.status(400).json({ message: "Loan amount must be a valid number (minimum LKR 1,000)." });
        }
        if (parseFloat(loanAmount) > 1000000) {
            return res.status(400).json({ message: "Loan amount cannot exceed LKR 1,000,000." });
        }
        if (!repaymentPeriod || isNaN(parseInt(repaymentPeriod)) || parseInt(repaymentPeriod) <= 0) {
            return res.status(400).json({ message: "Invalid repayment period." });
        }
        if (interestRate && (parseFloat(interestRate) < 0 || parseFloat(interestRate) > 20)) {
            return res.status(400).json({ message: "Interest rate must be between 0-20%." });
        }
        if (!purpose || !purpose.trim()) {
            return res.status(400).json({ message: "Loan purpose is required." });
        }
        if (!collateral || collateral.trim().length < 10) {
            return res.status(400).json({ message: "Please provide a detailed collateral description (min 10 characters)." });
        }
        if (!termsAccepted) {
            return res.status(400).json({ message: "Terms and conditions must be accepted." });
        }
        if (!asc) {
            return res.status(400).json({ message: "ASC selection is required." });
        }

        // ─── Check for outstanding loans ───
        const outstandingLoans = await Loan.findOne({
            farmer: req.user._id,
            $or: [
                { status: 'PENDING' },
                { 
                    status: 'APPROVED',
                    $expr: { $lt: ['$totalPaid', '$totalPayable'] }
                }
            ]
        });

        if (outstandingLoans) {
            return res.status(400).json({ 
                message: "Please pay the existing loan payment after that you can request a new loan" 
            });
        }

        // Calculate EMI and Total Payable
        const P = parseFloat(loanAmount);
        const r = (parseFloat(interestRate || 8) / 100) / 12;
        const n = parseInt(repaymentPeriod);
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayable = emi * n;

        const newLoan = new Loan({
            farmer: req.user._id,
            amount: P,
            repaymentPeriod: n,
            interestRate: interestRate || 8,
            purpose: purpose.trim(),
            collateral: collateral.trim(),
            termsAccepted,
            asc,
            monthlyInstallment: emi.toFixed(2),
            totalPayable: totalPayable.toFixed(2),
            loanImage: req.file ? req.file.path : null
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

// Update loan details (Farmer can edit LOAN AMOUNT, PURPOSE and COLLATERAL on PENDING loans)
// RepaymentPeriod auto-calculates based on loan amount
router.put("/:id", protect, authorize("FARMER"), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }
        
        // Only the farmer who created the loan can edit it
        if (loan.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to edit this loan" });
        }
        
        // Only PENDING loans can be edited
        if (loan.status !== 'PENDING') {
            return res.status(400).json({ message: "Only pending loans can be edited" });
        }

        const { loanAmount, purpose, collateral } = req.body;

        // ─── Validation Guards ───
        if (!loanAmount || isNaN(parseFloat(loanAmount)) || parseFloat(loanAmount) < 1000) {
            return res.status(400).json({ message: "Loan amount must be a valid number (minimum LKR 1,000)." });
        }
        
        if (!purpose || !purpose.trim()) {
            return res.status(400).json({ message: "Loan purpose is required." });
        }
        
        if (!collateral || collateral.trim().length < 10) {
            return res.status(400).json({ message: "Please provide a detailed collateral description (min 10 characters)." });
        }

        // Update loan amount
        loan.amount = parseFloat(loanAmount);
        loan.purpose = purpose.trim();
        loan.collateral = collateral.trim();

        // Auto-calculate repayment period based on new amount
        const amountValue = parseFloat(loanAmount);
        let repaymentPeriod = 48;
        if (amountValue <= 25000) repaymentPeriod = 6;
        else if (amountValue <= 50000) repaymentPeriod = 18;
        else if (amountValue <= 100000) repaymentPeriod = 36;
        else repaymentPeriod = 48;

        loan.repaymentPeriod = repaymentPeriod;

        // Recalculate EMI and Total Payable with new amount and period
        const P = loan.amount;
        const r = (loan.interestRate / 100) / 12;
        const n = loan.repaymentPeriod;
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayable = emi * n;
        
        loan.monthlyInstallment = emi.toFixed(2);
        loan.totalPayable = totalPayable.toFixed(2);

        await loan.save();
        res.json({ message: "Loan updated successfully!", loan });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete loan (Farmer can only delete PENDING loans)
router.delete("/:id", protect, authorize("FARMER"), async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }
        
        // Only the farmer who created the loan can delete it
        if (loan.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this loan" });
        }
        
        // Only PENDING loans can be deleted
        if (loan.status !== 'PENDING') {
            return res.status(400).json({ message: "Only pending loans can be deleted" });
        }

        await Loan.findByIdAndDelete(req.params.id);
        res.json({ message: "Loan deleted successfully!" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update loan status (Approval sets initial payment date)
router.patch("/:id/status", protect, authorize("FINANCIAL_OFFICER", "ADMIN"), async (req, res) => {
    try {
        const { status, officerMessage, officerNotes } = req.body;
        
        if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: "Status must be APPROVED or REJECTED" });
        }

        const update = { status, reviewedBy: req.user._id };

        if (officerMessage) {
            update.officerMessage = officerMessage.trim();
        }
        
        if (officerNotes) {
            update.officerNotes = officerNotes.trim();
        }

        if (status === 'APPROVED') {
            update.approvedDate = new Date();
            // Calculate first payment due date: 1 month from approval date
            const approvalDate = new Date();
            const nextMonth = new Date(approvalDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            update.nextPaymentDate = nextMonth;
            
            // Get repayment period from the loan being updated
            const loanToUpdate = await Loan.findById(req.params.id);
            if (loanToUpdate) {
                const deadline = new Date(approvalDate);
                deadline.setMonth(deadline.getMonth() + loanToUpdate.repaymentPeriod);
                update.loanDeadline = deadline;
                console.log('✅ Loan APPROVED - Approval Date:', approvalDate.toLocaleDateString(), 'Loan Deadline:', deadline.toLocaleDateString(), 'Period:', loanToUpdate.repaymentPeriod, 'months');
            } else {
                console.log('✅ Loan APPROVED - Approval Date:', approvalDate.toLocaleDateString(), 'First Payment Due:', nextMonth.toLocaleDateString());
            }
        }

        const loan = await Loan.findByIdAndUpdate(req.params.id, update, { new: true }).populate('farmer', 'name email');
        res.json({ message: `Loan ${status} successfully!`, loan });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Submit a repayment (Farmer)
router.post("/repayments", protect, authorize("FARMER"), upload.single("receipt"), async (req, res) => {
    try {
        const { loanId, amount, notes } = req.body;
        
        if (!loanId) return res.status(400).json({ message: "Loan ID is required" });
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: "A valid positive repayment amount is required" });
        }
        if (!req.file) return res.status(400).json({ message: "Payment proof (bank slip) is required" });

        const repayment = await Repayment.create({
            loan: loanId,
            farmer: req.user._id,
            amount: parseFloat(amount),
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
            console.log('👨‍🌾 Fetching repayments for farmer:', req.user._id);
        } else {
            const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;
            // Get all repayments for loans in the officer's ASC
            const loansInAsc = await Loan.find({ asc: ascId }).select('_id');
            const loanIds = loansInAsc.map(l => l._id);
            query.loan = { $in: loanIds };
            console.log('👮 Fetching repayments for officer, loans:', loanIds.length);
        }

        const repayments = await Repayment.find(query)
            .populate('farmer', 'name email nic')
            .populate('loan', 'amount totalPayable purpose nextPaymentDate totalPaid')
            .sort({ createdAt: -1 });
        
        console.log('📊 Returning repayments:', repayments.map(r => ({ 
            id: r._id, 
            status: r.status, 
            hasAdminNotes: !!r.adminNotes,
            adminNotesLength: r.adminNotes?.length || 0
        })));
        
        res.json(repayments);
    } catch (err) {
        console.error('🚨 Error fetching repayments:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// Get repayments for a specific loan
router.get("/:loanId/repayments", protect, async (req, res) => {
    try {
        const { loanId } = req.params;
        
        // Verify the loan exists and belongs to the officer's ASC
        const loan = await Loan.findById(loanId).populate('asc', '_id');
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }
        
        // If officer, verify they have access to this loan's ASC
        if (req.user.role !== "FARMER" && req.user.role !== "ADMIN") {
            const ascId = req.user.assignedAsc?._id || req.user.assignedAsc;
            if (loan.asc._id.toString() !== ascId.toString()) {
                return res.status(403).json({ message: "You do not have access to this loan" });
            }
        }
        
        // If farmer, verify it's their loan
        if (req.user.role === "FARMER" && loan.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You do not have access to this loan" });
        }
        
        // Fetch repayments for this loan
        const repayments = await Repayment.find({ loan: loanId })
            .populate('farmer', 'name email nic')
            .sort({ paymentDate: 1 });
        
        res.json(repayments);
    } catch (err) {
        console.error('🚨 Error fetching repayments for loan:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// Verify or Reject repayment (Officer)
router.patch("/repayments/:id/verify", protect, authorize("FINANCIAL_OFFICER", "ADMIN"), async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        
        console.log('\n🔍 ==================== VERIFY REPAYMENT ====================');
        console.log('📋 Request:', { id: req.params.id, status, notesLength: adminNotes?.length, officer: req.user.role });
        
        // Validate status
        if (!status) {
            console.log('❌ No status provided');
            return res.status(400).json({ message: "Status is required (VERIFIED or REJECTED)" });
        }
        
        if (!['VERIFIED', 'REJECTED'].includes(status)) {
            console.log('❌ Invalid status:', status);
            return res.status(400).json({ message: `Invalid status '${status}'. Must be VERIFIED or REJECTED.` });
        }
        
        // Validate notes
        if (!adminNotes) {
            console.log('❌ No notes provided');
            return res.status(400).json({ message: "Officer notes are required." });
        }
        
        if (adminNotes.trim().length === 0) {
            console.log('❌ Empty notes provided');
            return res.status(400).json({ message: "Officer notes cannot be empty." });
        }

        // Find repayment
        const repayment = await Repayment.findById(req.params.id);
        if (!repayment) {
            console.log('❌ Repayment not found:', req.params.id);
            return res.status(404).json({ message: "Repayment not found" });
        }

        // Check if already processed
        if (repayment.status !== 'PENDING') {
            console.log('❌ Repayment already processed. Current status:', repayment.status);
            return res.status(400).json({ message: `Repayment is already ${repayment.status}. Cannot reprocess.` });
        }

        console.log('✏️  Updating repayment from PENDING to', status);
        
        // Update repayment
        repayment.status = status;
        repayment.adminNotes = adminNotes.trim();
        const savedRepayment = await repayment.save();
        
        console.log('✅ Repayment saved:');
        console.log('   Status:', savedRepayment.status);
        console.log('   AdminNotes:', savedRepayment.adminNotes?.substring(0, 50));
        console.log('   Full adminNotes saved:', !!savedRepayment.adminNotes);

        // If verified, update loan
        if (status === 'VERIFIED') {
            console.log('💰 Processing VERIFIED status - updating loan totals');
            const loan = await Loan.findById(repayment.loan);
            
            if (!loan) {
                console.log('❌ Loan not found:', repayment.loan);
                return res.status(404).json({ message: "Associated loan not found" });
            }
            
            console.log('📊 Loan before update - totalPaid:', loan.totalPaid, 'amount:', repayment.amount);
            
            loan.totalPaid = (loan.totalPaid || 0) + repayment.amount;

            // Advance next payment date
            const currentDue = loan.nextPaymentDate || new Date();
            const nextDue = new Date(currentDue);
            nextDue.setMonth(nextDue.getMonth() + 1);
            loan.nextPaymentDate = nextDue;

            await loan.save();
            console.log('💾 Loan updated - new totalPaid:', loan.totalPaid, 'nextDue:', loan.nextPaymentDate);
        }

        // Fetch updated repayment with full details
        const responseRepayment = await Repayment.findById(req.params.id)
            .populate('farmer', 'name email nic')
            .populate('loan', 'amount totalPayable purpose status');

        console.log('📤 Sending response:');
        console.log('   Status:', responseRepayment.status);
        console.log('   AdminNotes included:', !!responseRepayment.adminNotes);
        console.log('   AdminNotes preview:', responseRepayment.adminNotes?.substring(0, 50));
        console.log('🔍 ==================== VERIFY COMPLETE ====================\n');
        
        res.json({ 
            message: `Repayment successfully marked as ${status}`,
            repayment: responseRepayment 
        });
        
    } catch (err) {
        console.error('🚨 VERIFICATION ERROR:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

module.exports = router;
