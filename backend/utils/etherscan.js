const axios = require("axios");

// Function to get the transaction list for a wallet address
const getTransactions = async (walletAddress) => {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`
    );
    return response.data.result; // Returns transaction list
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

module.exports = { getTransactions };
