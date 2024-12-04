const Transaction = require("../model/Transaction");

const calculateStats = async (walletId, days) => {
  try {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - days);

    // Fetch transactions for the given wallet and time period
    const transactions = await Transaction.find({
      walletId,
      timestamp: { $gte: pastDate, $lte: now },
    });

    if (!transactions.length) {
      return {
        pnlAchieved: 0,
        pnlUnrealized: 0,
        pnlTotal: 0,
        tokensTraded: 0,
        totalVolume: 0,
        successRate: "N/A",
      };
    }

    let pnlAchieved = 0;
    let pnlUnrealized = 0;
    let totalVolume = 0;
    let totalTrades = transactions.length;
    let successfulTrades = 0;
    let tokensTraded = new Set();

    transactions.forEach((tx) => {
      // Record the token for "tokens traded" count
      tokensTraded.add(tx.tokenSymbol);

      // Calculate trade volume
      totalVolume += tx.value;

      // Assume that 'buy' is an investment and 'sell' is a realization of profit/loss
      if (tx.type === "sell") {
        pnlAchieved += tx.value; // Add realized profit
        successfulTrades += 1; // Assuming any sell is a successful trade
      } else if (tx.type === "buy") {
        pnlUnrealized += tx.value; // Add to unrealized profit
      }
    });

    // Calculate total PnL
    const pnlTotal = pnlAchieved + pnlUnrealized;

    // Calculate success rate
    const successRate = ((successfulTrades / totalTrades) * 100).toFixed(2);

    return {
      pnlAchieved: pnlAchieved.toFixed(2),
      pnlUnrealized: pnlUnrealized.toFixed(2),
      pnlTotal: pnlTotal.toFixed(2),
      tokensTraded: tokensTraded.size,
      totalVolume: totalVolume.toFixed(2),
      successRate: `${successRate}%`,
    };
  } catch (error) {
    console.error("Error calculating stats:", error);
    throw new Error("Failed to calculate stats");
  }
};

// Fetch stats for 7 and 30 days
const getWalletStats = async (walletId) => {
  try {
    const stats7Days = await calculateStats(walletId, 7);
    const stats30Days = await calculateStats(walletId, 30);

    return {
      stats7Days,
      stats30Days,
    };
  } catch (error) {
    console.error("Error fetching wallet stats:", error);
    throw new Error("Failed to fetch wallet stats");
  }
};

module.exports = {
  getWalletStats,
};
