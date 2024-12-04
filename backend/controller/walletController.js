const { getTransactions } = require("../utils/etherscan");
const { sendTelegramMessage } = require("../utils/telegram");
const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");
const ethers = require("ethers");

// Get all wallets
const getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find(); // Fetch all wallets from DB
    res.status(200).json(wallets); // Send wallets as JSON
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching wallets", error: error.message });
  }
};

const registerWallet = async (req, res) => {
  const { walletName, walletAddress } = req.body;

  try {
    const wallet = new Wallet({ walletName, walletAddress, active: true });
    await wallet.save();
    res.status(201).send("Wallet registered");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const toggleWalletStatus = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    wallet.active = !wallet.active;
    await wallet.save();
    res.status(200).send("Wallet status updated");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Remove wallet by ID
const removeWallet = async (req, res) => {
  const { walletId } = req.params;

  try {
    const deletedWallet = await Wallet.findByIdAndDelete(walletId);
    if (!deletedWallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    return res
      .status(200)
      .json({ message: "Wallet removed successfully", walletId });
  } catch (error) {
    console.error("Error removing wallet:", error);
    return res.status(500).json({ error: "Failed to remove wallet" });
  }
};

const getTokenSymbol = async (tokenAddress) => {
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${tokenAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`
    );
    const data = await response.json();

    if (data.status === "1" && data.result.length > 0) {
      return data.result[0].symbol || "UNKNOWN";
    } else {
      console.error("Etherscan API error:", data.message);
      return "UNKNOWN";
    }
  } catch (error) {
    console.error(
      `Failed to fetch token symbol for address: ${tokenAddress}`,
      error
    );
    return "UNKNOWN";
  }
};

// Function to check transactions and send alerts for new transactions
const checkTransactions = async () => {
  try {
    // Get all active wallets from the database
    const activeWallets = await Wallet.find({ active: true });

    for (const wallet of activeWallets) {
      // Fetch the latest transactions for the wallet
      const transactions = await getTransactions(wallet.walletAddress);
      const tokenSymbol = await getTokenSymbol(wallet.walletAddress);

      for (const tx of transactions) {
        // Check if the transaction hash already exists in the Transaction collection
        const existingTransaction = await Transaction.findOne({
          transactionHash: tx.hash,
        });

        if (!existingTransaction) {
          // If the transaction is not already processed, it's a new transaction
          console.log("New transaction detected:", tx.hash);

          // Assuming tx.to is a buy and tx.from is a sell (simplified logic)
          let type = "unknown";
          if (tx.to === wallet.walletAddress) {
            // If the wallet is the receiver, it's a buy
            type = "buy";
            await sendTelegramMessage(
              `🚨 PURCHASE ⬆️ - Wallet: ${wallet.walletName}\nDate: ${tx.timeStamp}\nToken: ${tokenSymbol}\nTransaction: https://etherscan.io/tx/${tx.hash}`
            );
          } else if (tx.from === wallet.walletAddress) {
            // If the wallet is the sender, it's a sell
            type = "sell";
            await sendTelegramMessage(
              `🚨 SALE ⬇️ - Wallet: ${wallet.walletName}\nDate: ${tx.timeStamp}\nToken: ${tokenSymbol}\nTransaction: https://etherscan.io/tx/${tx.hash}`
            );
          }

          // Save the new transaction to the database
          const newTransaction = new Transaction({
            walletId: wallet._id,
            transactionHash: tx.hash,
            tokenSymbol,
            timestamp: new Date(tx.timeStamp * 1000), // Convert timestamp to Date
            value: tx.value, // Assuming tx.value is available, adjust as needed
            type,
          });

          await newTransaction.save();
        } else {
          // console.log("Transaction already processed:", tx.hash);
        }
      }
    }
  } catch (error) {
    console.error("Error checking transactions:", error);
  }
};

module.exports = {
  getAllWallets,
  registerWallet,
  toggleWalletStatus,
  removeWallet,
  checkTransactions,
};
