const mongoose = require("mongoose");

const ethTokenSchema = mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  symbol: { type: String, required: true },
  address: { type: String, required: true },
  liquidity: { type: Number, required: true },
  holders: { type: Number, required: true },
});

module.exports = mongoose.model("ETHToken", ethTokenSchema);
