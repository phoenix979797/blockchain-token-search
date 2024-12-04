// server/models/Transaction.js
const mongoose = require("mongoose");

// Schema for storing transaction details
const transactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  transactionHash: { type: String, required: true, unique: true }, // Unique hash to track processed transactions
  tokenSymbol: { type: String, required: true },
  timestamp: { type: Date, required: true },
  value: { type: Number, required: true },
  type: { type: String, enum: ["buy", "sell"], required: true }, // Track whether it's a buy or sell
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
