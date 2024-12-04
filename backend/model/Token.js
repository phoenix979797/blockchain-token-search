const mongoose = require("mongoose");

const tokenSchema = mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  tokenAddress: { type: String, required: true },
  poolAddress: { type: String, required: true },
  firstAddress: { type: String, required: true },
  nextAddress: { type: String, required: true },
  status: { type: String, require: true },
  dextoolsUrl: { type: String, require: true },
});

module.exports = mongoose.model("Token", tokenSchema);
