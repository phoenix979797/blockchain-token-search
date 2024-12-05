const express = require("express");
const router = express.Router();

router.use("/token", require("./tokenRoutes"));
router.use("/transaction", require("./transactionRoutes"));
router.use("/wallets", require("./walletRoutes"));
router.use("/stats", require("./statsRoutes"));
router.use("/ethtoken", require("./ethTokenRoutes"));
router.use("/search", require("./search"));

module.exports = router;
