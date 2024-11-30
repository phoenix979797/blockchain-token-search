const mongoose = require('mongoose');

const projectSchema = mongoose.Schema({
    id: { type: String, required: true },
    date: { type: Date, required: true },
    tokenName: { type: String, required: true },
    liquidity: { type: Number, required: true },
    walletAddress: { type: String, required: true },
});

module.exports = mongoose.model('Project', projectSchema);
