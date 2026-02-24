const express = require('express');
const router = express.Router();
const ASC = require('../models/ASC');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all ASCs
// @route   GET /api/ascs
// @access  Public (or Protected based on requirement, usually public for selection)
router.get('/', async (req, res) => {
    try {
        const ascs = await ASC.find()
            .populate({
                path: 'assignedOfficers',
                select: 'name email role nic'
            })
            .sort({ district: 1, name: 1 });
        res.status(200).json(ascs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get ASC by ID
// @route   GET /api/ascs/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const asc = await ASC.findById(req.params.id);
        if (!asc) {
            return res.status(404).json({ message: 'ASC not found' });
        }
        res.status(200).json(asc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all staff assigned to an ASC center
// @route   GET /api/ascs/:id/staff
// @access  Private (Officer/Admin)
router.get('/:id/staff', protect, async (req, res) => {
    try {
        const staff = await User.find({
            assignedAsc: req.params.id,
            role: { $ne: 'FARMER' }
        }).select('-password');
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all farmers registered under an ASC center
// @route   GET /api/ascs/:id/farmers
// @access  Private (Officer/Admin)
router.get('/:id/farmers', protect, async (req, res) => {
    try {
        const farmers = await User.find({
            assignedAsc: req.params.id,
            role: 'FARMER'
        }).select('-password');
        res.status(200).json(farmers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new ASC
// @route   POST /api/ascs
// @access  Private (Admin only)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const { code, name, district, address, contactNumber } = req.body;

        const ascExists = await ASC.findOne({ code });
        if (ascExists) {
            return res.status(400).json({ message: 'ASC with this code already exists' });
        }

        const asc = await ASC.create({
            code,
            name,
            district,
            address,
            contactNumber
        });

        res.status(201).json(asc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update ASC
// @route   PUT /api/ascs/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const asc = await ASC.findById(req.params.id);

        if (!asc) {
            return res.status(404).json({ message: 'ASC not found' });
        }

        const updatedASC = await ASC.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedASC);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete ASC
// @route   DELETE /api/ascs/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const asc = await ASC.findById(req.params.id);

        if (!asc) {
            return res.status(404).json({ message: 'ASC not found' });
        }

        await asc.deleteOne();
        res.status(200).json({ message: 'ASC removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
