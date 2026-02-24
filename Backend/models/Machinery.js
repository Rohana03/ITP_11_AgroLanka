const mongoose = require("mongoose");

const machinerySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ["Tractor", "Harvester", "Plough", "Seeder", "Sprayer", "Thresher", "Rotavator", "Other"]
        },
        asc: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ASC',
            required: true
        },
        totalCount: {
            type: Number,
            required: true,
            default: 1
        },
        availableCount: {
            type: Number,
            required: true,
            default: 1
        },
        status: {
            type: String,
            enum: ["Available", "Maintenance", "Out of Stock"],
            default: "Available"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Machinery", machinerySchema);
