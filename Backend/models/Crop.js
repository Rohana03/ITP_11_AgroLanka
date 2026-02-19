const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        cropType: {
            type: String,
            required: true
        },
        variety: {
            type: String,
            required: true
        },
        landSize: {
            type: Number,
            required: true
        },
        plantingDate: {
            type: Date,
            required: false
        },
        expectedHarvest: {
            type: Date,
            required: false
        },
        season: {
            type: String,
            enum: ["Yala", "Maha", "N/A"],
            default: "N/A"
        },
        location: {
            type: String,
            required: true
        },
        soilType: {
            type: String,
            required: true
        },
        assignedAsc: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ASC',
            required: true
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Crop", cropSchema);
