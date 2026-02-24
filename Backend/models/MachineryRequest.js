const mongoose = require("mongoose");

const machineryRequestSchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        machinery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Machinery',
            required: true
        },
        requestDate: {
            type: Date,
            required: true
        },
        duration: {
            type: String,
            required: true,
            enum: ["Half Day", "Full Day", "2 Days", "3 Days", "1 Week", "Custom"]
        },
        location: {
            type: String,
            required: true
        },
        landSize: {
            type: Number,
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
        },
        additionalNotes: String
    },
    { timestamps: true }
);

module.exports = mongoose.model("MachineryRequest", machineryRequestSchema);
