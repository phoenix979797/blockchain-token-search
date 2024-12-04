const { getWalletStats } = require("../service/statsService");

// Controller function to get stats for a wallet
const getStatsForWallet = async (req, res) => {
  try {
    const { walletId } = req.params;

    const stats = await getWalletStats(walletId);

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error in stats endpoint:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};

module.exports = { getStatsForWallet };
