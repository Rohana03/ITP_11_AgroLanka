const mongoose = require("mongoose");

const compensationSchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        crop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Crop',
            required: true
        },
        damageType: {
            type: String,
            required: true,
            enum: ["flood", "drought", "pest", "disease", "wildlife", "storm", "other"]
        },
        incidentDate: {
            type: Date,
            required: true
        },
        affectedArea: {
            type: Number,
            required: true
        },
        damageDescription: {
            type: String,
            required: true
        },
        evidenceFiles: [
            {
                type: String // Paths to uploaded files
            }
        ],
        estimatedLoss: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING"
        },
        asc: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ASC',
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Compensation", compensationSchema);
