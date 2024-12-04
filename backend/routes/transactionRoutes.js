const express = require("express");
const { transactions } = require("../controller/transactionController");
const router = express.Router();

router.post("/", transactions);

module.exports = router;
