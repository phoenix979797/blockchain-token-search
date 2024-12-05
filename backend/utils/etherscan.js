const axios = require("axios");

// Function to get the transaction list for a wallet address
const getTransactions = async (walletAddress) => {
  try {
    const transactions = await axios.get(
      `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${walletAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`
    );

    return transactions?.data?.result || []; // Returns transaction list
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

module.exports = { getTransactions };
