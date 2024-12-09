const express = require("express");
const { getSymbol, getLogs } = require("../controller/transactionController");
const router = express.Router();

router.get("/symbol", getSymbol);
router.get("/logs", getLogs);

module.exports = router;
