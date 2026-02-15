const mongoose = require('mongoose');

const ascSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    contactNumber: {
        type: String,
        default: ''
    },
    assignedOfficers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('ASC', ascSchema);
