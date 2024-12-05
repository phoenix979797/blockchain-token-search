const mongoose = require("mongoose");

const tokenSchema = mongoose.Schema({
  name: { type: String, required: true },
  datetime: { type: String, required: true },
  tokenAddress: { type: String, required: true },
  walletAddLiquidity: { type: String, required: true },
  walletFirstTransaction: { type: String, required: true },
  nameWalletAddLiquidity: { type: String, required: true },
  nameWalletFirstTransaction: { type: String, required: true },
});

module.exports = mongoose.model("Token", tokenSchema);
