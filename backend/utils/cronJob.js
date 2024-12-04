const cron = require("node-cron");
const { checkTransactions } = require("../controller/walletController");
const Wallet = require("../model/Wallet");

// Run the transaction check every 5 minutes (adjust as needed)
cron.schedule("*/1 * * * *", async () => {
  console.log("Checking transactions for registered wallets...");
  checkTransactions();
});
