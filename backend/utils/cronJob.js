const cron = require("node-cron");
const { checkTransactions } = require("../controller/walletController");
const Wallet = require("../model/Wallet");

// Run the transaction check every 5 minutes (adjust as needed)
cron.schedule("*/5 * * * *", async () => {
  console.log("Checking transactions for registered wallets...");
  const wallets = await Wallet.find({ active: true });
  for (let i = 0; i < wallets.length; i++) {
    checkTransactions(wallets[i].walletId);
  }
});
