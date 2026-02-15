const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ASC = require('../models/ASC');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all officers (ASC_OFFICER, STORE_OFFICER)
// @route   GET /api/admin/officers
// @access  Private (Admin only)
router.get('/officers', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const officers = await User.find({
            role: { $in: ['ASC_OFFICER', 'STORE_OFFICER'] }
        })
            .select('-password')
            .populate('assignedAsc', 'name code district');

        res.status(200).json(officers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign officer to ASC
// @route   PUT /api/admin/assign-officer
// @access  Private (Admin only)
router.put('/assign-officer', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const { userId, ascId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify role
        if (!['ASC_OFFICER', 'STORE_OFFICER'].includes(user.role)) {
            return res.status(400).json({ message: 'User is not an officer' });
        }

        // If assigning to an ASC, verify ASC exists
        if (ascId) {
            const asc = await ASC.findById(ascId);
            if (!asc) {
                return res.status(404).json({ message: 'ASC not found' });
            }

            // Remove from old ASC if exists
            if (user.assignedAsc) {
                await ASC.findByIdAndUpdate(user.assignedAsc, {
                    $pull: { assignedOfficers: user._id }
                });
            }

            // Add to new ASC
            await ASC.findByIdAndUpdate(ascId, {
                $addToSet: { assignedOfficers: user._id }
            });
        } else {
            // If unassigning (ascId is null/empty)
            if (user.assignedAsc) {
                await ASC.findByIdAndUpdate(user.assignedAsc, {
                    $pull: { assignedOfficers: user._id }
                });
            }
        }

        user.assignedAsc = ascId || null;
        await user.save();

        const updatedUser = await User.findById(userId)
            .select('-password')
            .populate('assignedAsc', 'name code district');

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
