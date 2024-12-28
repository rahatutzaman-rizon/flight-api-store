const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        flyFrom: { type: String, required: true },
        flyTo: { type: String, required: true },
        local_departure: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Flight', flightSchema);
