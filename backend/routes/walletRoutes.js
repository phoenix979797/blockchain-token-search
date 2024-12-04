const express = require("express");
const {
  getAllWallets,
  registerWallet,
  removeWallet,
  toggleWalletStatus,
} = require("../controller/walletController");
const router = express.Router();

router.get("/", getAllWallets); // Get all wallets
router.post("/", registerWallet);
router.delete("/:walletId", removeWallet);
router.patch("/:id/status", toggleWalletStatus);

module.exports = router;
