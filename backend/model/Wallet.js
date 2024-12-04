const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  walletName: { type: String, required: true },
  walletAddress: { type: String, required: true, unique: true },
  active: { type: Boolean, default: false },
});

module.exports = mongoose.model("Wallet", walletSchema);
