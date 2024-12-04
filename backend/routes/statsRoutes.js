const express = require("express");
const { getStatsForWallet } = require("../controller/statsController");
const router = express.Router();

// Route to get trading stats for a specific wallet
router.get("/:id", getStatsForWallet);

module.exports = router;
