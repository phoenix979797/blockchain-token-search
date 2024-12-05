const express = require("express");
const { getEthTokens } = require("../controller/ethTokenController");
const router = express.Router();

// Route to get trading stats for a specific wallet
router.get("/", getEthTokens);

module.exports = router;
