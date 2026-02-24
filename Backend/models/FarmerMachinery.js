const mongoose = require("mongoose");

const farmerMachinerySchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        machineryType: {
            type: String,
            required: true,
            enum: ["Tractor", "Harvester", "Plough", "Seeder", "Sprayer", "Thresher", "Rotavator", "Other"]
        },
        description: {
            type: String,
            required: true
        },
        rentPerDay: {
            type: Number,
            required: true
        },
        contactNumber: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["Available", "Rented", "Hidden"],
            default: "Available"
        },
        asc: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ASC',
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("FarmerMachinery", farmerMachinerySchema);
