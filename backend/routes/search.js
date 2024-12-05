const express = require("express");
const {
  getAutoSearchStatus,
  setAutoSearchStatus,
} = require("../controller/searchController");
const router = express.Router();

// Route to get trading stats for a specific wallet
router.get("/", getAutoSearchStatus);
router.post("/", setAutoSearchStatus);

module.exports = router;
