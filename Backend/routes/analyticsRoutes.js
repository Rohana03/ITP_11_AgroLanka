const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Crop = require('../models/Crop');
const FarmerMachinery = require('../models/FarmerMachinery');
const Machinery = require('../models/Machinery');
const ASC = require('../models/ASC');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/analytics', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const { district } = req.query;

        // --- 1. User Distribution ---
        const userPipeline = [
            {
                $lookup: {
                    from: 'ascs',
                    localField: 'assignedAsc',
                    foreignField: '_id',
                    as: 'ascDetails'
                }
            },
            { $unwind: { path: '$ascDetails', preserveNullAndEmptyArrays: true } }
        ];

        if (district && district !== 'All') {
            userPipeline.push(
                {
                    $match: {
                        $or: [
                            { 'ascDetails.district': district },
                            { serviceDistricts: district }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        role: '$_id',
                        count: 1,
                        _id: 0
                    }
                }
            );
        } else {
            userPipeline.push(
                {
                    $group: {
                        _id: { $ifNull: ['$ascDetails.district', 'Unassigned'] },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        district: '$_id',
                        count: 1,
                        _id: 0
                    }
                }
            );
        }
        userPipeline.push({ $sort: { count: -1 } });
        const userDistribution = await User.aggregate(userPipeline);

        // --- 2. Crop Cultivation distribution ---
        const cropPipeline = [
            {
                $lookup: {
                    from: 'ascs',
                    localField: 'assignedAsc',
                    foreignField: '_id',
                    as: 'ascDetails'
                }
            },
            { $unwind: { path: '$ascDetails', preserveNullAndEmptyArrays: true } }
        ];

        if (district && district !== 'All') {
            cropPipeline.push({ $match: { 'ascDetails.district': district } });
        }

        cropPipeline.push(
            {
                $group: {
                    _id: '$cropType',
                    totalAcres: { $sum: '$landSize' } // Crop model uses landSize
                }
            },
            {
                $project: {
                    cropType: '$_id',
                    totalAcres: 1,
                    _id: 0
                }
            },
            { $sort: { totalAcres: -1 } }
        );
        const cropDistribution = await Crop.aggregate(cropPipeline);

        // --- 3. Machinery Counts by Type ---
        // Combine FarmerMachinery and ASC Inventory Machinery

        // 3a. Farmer Owned
        const farmerMachineryPipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner', // In later models it might just be farmer, but FarmerMachinery uses 'farmer'
                    foreignField: '_id',
                    as: 'ownerDetails'
                }
            },
            { $unwind: { path: '$ownerDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'ascs',
                    localField: 'ownerDetails.assignedAsc',
                    foreignField: '_id',
                    as: 'ascDetails'
                }
            },
            { $unwind: { path: '$ascDetails', preserveNullAndEmptyArrays: true } }
        ];

        // 3b. ASC Inventory
        const ascMachineryPipeline = [
            {
                $lookup: {
                    from: 'ascs',
                    localField: 'asc',
                    foreignField: '_id',
                    as: 'ascDetails'
                }
            },
            { $unwind: { path: '$ascDetails', preserveNullAndEmptyArrays: true } }
        ];

        if (district && district !== 'All') {
            farmerMachineryPipeline.push({ $match: { 'ascDetails.district': district } });
            ascMachineryPipeline.push({ $match: { 'ascDetails.district': district } });
        }

        farmerMachineryPipeline.push(
            {
                $group: {
                    _id: { $ifNull: ['$type', '$machineryType'] },
                    count: { $sum: 1 }
                }
            }
        );
        ascMachineryPipeline.push(
            {
                $group: {
                    _id: '$type',
                    count: { $sum: '$availableCount' }
                }
            }
        );

        const [farmerMachineryDataCounts, ascMachineryDataCounts] = await Promise.all([
            FarmerMachinery.aggregate(farmerMachineryPipeline),
            Machinery.aggregate(ascMachineryPipeline)
        ]);

        // Merge both counts by type
        const machineryMap = {};
        farmerMachineryDataCounts.forEach(item => {
            const typeKey = item._id || 'Unknown';
            machineryMap[typeKey] = (machineryMap[typeKey] || 0) + item.count;
        });
        ascMachineryDataCounts.forEach(item => {
            const typeKey = item._id || 'Unknown';
            machineryMap[typeKey] = (machineryMap[typeKey] || 0) + item.count;
        });

        const machineryDistribution = Object.keys(machineryMap).map(key => ({
            type: key,
            count: machineryMap[key]
        })).sort((a, b) => b.count - a.count);

        // --- Summaries ---
        let totalUsers = 0, totalCrops = 0, totalMachinery = 0;

        totalUsers = userDistribution.reduce((acc, curr) => acc + curr.count, 0);

        if (district && district !== 'All') {
            const cropsLookup = await Crop.aggregate([
                ...cropPipeline.slice(0, 3),
                { $count: 'total' }
            ]);
            totalCrops = cropsLookup.length > 0 ? cropsLookup[0].total : 0;

            // Re-calculate simply for summary
            totalMachinery = machineryDistribution.reduce((acc, curr) => acc + curr.count, 0);
        } else {
            totalCrops = await Crop.countDocuments();
            // Need sum of both collections
            const farmerMachineryCount = await FarmerMachinery.countDocuments();
            const ascMachineryDocs = await Machinery.find();
            const ascMachineryCount = ascMachineryDocs.reduce((acc, itm) => acc + (itm.availableCount || 0), 0);
            totalMachinery = farmerMachineryCount + ascMachineryCount;
        }

        res.json({
            success: true,
            data: {
                userDistribution,
                cropDistribution,
                machineryDistribution,
                summary: {
                    totalUsers,
                    totalCrops,
                    totalMachinery
                }
            }
        });

    } catch (error) {
        console.error('Error fetching analytics data:', error);
        res.status(500).json({ success: false, message: 'Server error fetching analytics data' });
    }
});

// Endpoint for generating a detailed District PDF Report (Grouped by ASC if district is selected)
router.get('/district-reports', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const { district } = req.query;

        // --- USERS ---
        const userPipeline = [
            {
                $lookup: {
                    from: 'ascs',
                    localField: 'assignedAsc',
                    foreignField: '_id',
                    as: 'ascDetails'
                }
            },
            { $unwind: { path: '$ascDetails', preserveNullAndEmptyArrays: true } }
        ];

        if (district && district !== 'All') {
            userPipeline.push({
                $match: {
                    $or: [
                        { 'ascDetails.district': district },
                        { serviceDistricts: district }
                    ]
                }
            });
            userPipeline.push({
                $group: {
                    _id: {
                        key: { $ifNull: ['$ascDetails.name', 'District Level (General)'] },
                        role: '$role'
                    },
                    count: { $sum: 1 }
                }
            });
        } else {
            userPipeline.push({
                $group: {
                    _id: {
                        key: { $ifNull: ['$ascDetails.district', 'Unassigned'] },
                        role: '$role'
                    },
                    count: { $sum: 1 }
                }
            });
        }
        const usersData = await User.aggregate(userPipeline);

        // --- CROPS ---
        const cropPipeline = [
            {
                $lookup: {
                    from: 'ascs',
                    localField: 'assignedAsc',
                    foreignField: '_id',
                    as: 'ascDetails'
                }
            },
            { $unwind: { path: '$ascDetails', preserveNullAndEmptyArrays: true } }
        ];

        if (district && district !== 'All') {
            cropPipeline.push({ $match: { 'ascDetails.district': district } });
            cropPipeline.push({
                $group: {
                    _id: { key: { $ifNull: ['$ascDetails.name', 'Unassigned'] }, cropType: '$cropType' },
                    totalAcres: { $sum: '$landSize' }
                }
            });
        } else {
            cropPipeline.push({
                $group: {
                    _id: { key: { $ifNull: ['$ascDetails.district', 'Unassigned'] }, cropType: '$cropType' },
                    totalAcres: { $sum: '$landSize' }
                }
            });
        }
        const cropsData = await Crop.aggregate(cropPipeline);

        // --- MACHINERY ---
        // Need to combine Farmer rentals and ASC Inventories for the District Report breakdown
        const farmerMachineryPipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'ownerDetails'
                }
            },
            { $unwind: { path: '$ownerDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'ascs',
                    localField: 'ownerDetails.assignedAsc',
                    foreignField: '_id',
                    as: 'ascDetails'
                }
            },
            { $unwind: { path: '$ascDetails', preserveNullAndEmptyArrays: true } }
        ];

        const ascMachineryPipeline = [
            {
                $lookup: {
                    from: 'ascs',
                    localField: 'asc',
                    foreignField: '_id',
                    as: 'ascDetails'
                }
            },
            { $unwind: { path: '$ascDetails', preserveNullAndEmptyArrays: true } }
        ];

        if (district && district !== 'All') {
            farmerMachineryPipeline.push({ $match: { 'ascDetails.district': district } });
            farmerMachineryPipeline.push({
                $group: {
                    _id: { key: { $ifNull: ['$ascDetails.name', 'Unassigned'] }, type: { $ifNull: ['$type', '$machineryType'] } },
                    count: { $sum: 1 }
                }
            });

            ascMachineryPipeline.push({ $match: { 'ascDetails.district': district } });
            ascMachineryPipeline.push({
                $group: {
                    _id: { key: { $ifNull: ['$ascDetails.name', 'Unassigned'] }, type: '$type' },
                    count: { $sum: '$availableCount' }
                }
            });
        } else {
            farmerMachineryPipeline.push({
                $group: {
                    _id: { key: { $ifNull: ['$ascDetails.district', 'Unassigned'] }, type: { $ifNull: ['$type', '$machineryType'] } },
                    count: { $sum: 1 }
                }
            });

            ascMachineryPipeline.push({
                $group: {
                    _id: { key: { $ifNull: ['$ascDetails.district', 'Unassigned'] }, type: '$type' },
                    count: { $sum: '$availableCount' }
                }
            });
        }

        const [farmerMachineryData, ascMachineryData] = await Promise.all([
            FarmerMachinery.aggregate(farmerMachineryPipeline),
            Machinery.aggregate(ascMachineryPipeline)
        ]);

        // Merge machinery data
        const machineryData = [];
        const mergedMachineryMap = new Map();

        const mergeItem = (item) => {
            const ascKey = item._id.key;
            const typeKey = item._id.type || 'Unknown';
            const compoundKey = `${ascKey}_${typeKey}`;

            if (mergedMachineryMap.has(compoundKey)) {
                mergedMachineryMap.set(compoundKey, mergedMachineryMap.get(compoundKey) + item.count);
            } else {
                mergedMachineryMap.set(compoundKey, item.count);
            }
        };

        farmerMachineryData.forEach(mergeItem);
        ascMachineryData.forEach(mergeItem);

        mergedMachineryMap.forEach((count, compoundKey) => {
            const [ascKey, typeKey] = compoundKey.split('_');
            machineryData.push({
                _id: { key: ascKey, type: typeKey },
                count: count
            });
        });

        // --- COMPILE DATA ---
        const formattedReport = {};

        const initKey = (k) => {
            if (!formattedReport[k]) {
                formattedReport[k] = { users: {}, crops: {}, machinery: {} };
            }
        };

        usersData.forEach(u => {
            if (u._id.key) {
                initKey(u._id.key);
                formattedReport[u._id.key].users[u._id.role] = u.count;
            }
        });

        cropsData.forEach(c => {
            if (c._id.key) {
                initKey(c._id.key);
                formattedReport[c._id.key].crops[c._id.cropType] = c.totalAcres;
            }
        });

        machineryData.forEach(m => {
            if (m._id.key) {
                initKey(m._id.key);
                formattedReport[m._id.key].machinery[m._id.type] = m.count;
            }
        });

        res.json({
            success: true,
            data: formattedReport
        });

    } catch (error) {
        console.error('Error fetching district reports data:', error);
        res.status(500).json({ success: false, message: 'Server error fetching district reports data' });
    }
});

module.exports = router;
