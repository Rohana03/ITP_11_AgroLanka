const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        serviceType: {
            type: String,
            required: true,
            enum: ["Machinery Rental", "Machinery with Operator", "Custom Farming Service", "Equipment Maintenance"]
        },
        requestDate: {
            type: Date,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
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

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
