const mongoose = require("mongoose");

const autoSearchSchema = mongoose.Schema({
  daysMax: { type: Number, required: true },
  daysMin: { type: Number, required: true },
  liquidityMax: { type: Number, required: true },
  liquidityMin: { type: Number, required: true },
  isProgress: { type: Boolean, required: true },
});

module.exports = mongoose.model("AutoSearch", autoSearchSchema);
