const mongoose = require("mongoose");

const tokenSchema = mongoose.Schema({
  name: { type: String },
  datetime: { type: String },
  tokenAddress: { type: String },
  addWallet: { type: String },
  walletFirstTransaction: { type: String },
  nameAddWallet: { type: String },
  nameWalletFirstTransaction: { type: String },
  tokenCard: { type: Object },
});

module.exports = mongoose.model("Token", tokenSchema);
