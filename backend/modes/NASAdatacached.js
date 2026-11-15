const mongoose = require("mongoose");

const nasaCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now, expires: 1800 } // TTL 30 mins
});

module.exports = mongoose.model("NasaCache", nasaCacheSchema);