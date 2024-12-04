const axios = require("axios");
const sleep = require("../utils/sleep");

const fetchTokenPrice = async (symbol, timestamp) => {
  const date = new Date(timestamp * 1000); // Convert timestamp to date
  const formattedDate = `${date.getDate()}-${
    date.getMonth() + 1
  }-${date.getFullYear()}`; // Format date as DD-MM-YYYY
  console.log(formattedDate);
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${symbol}/history?date=${formattedDate}`
    );

    const price = response.data?.market_data?.current_price?.usd;
    return price || null; // Return price in USD, or null if unavailable
  } catch (error) {
    console.error("Error fetching token price:");
    return null; // Return null if the price cannot be fetched
  }
};

exports.transactions = async (req, res) => {
  const { tokenAddress, page, count } = req.body;

  if (!tokenAddress)
    return res.status(400).json({ error: "Token address is required" });

  try {
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: "account",
        action: "tokentx",
        contractaddress: tokenAddress,
        apikey: process.env.ETHERSCAN_API_KEY,
      },
    });
    const transactions = response.data.result;
    let result = [];
    for (
      let i = (page - 1) * count;
      i <
      (page * count < transactions.length ? page * count : transactions.length);
      i++
    ) {
      let price = "N / A";
      for (let j = 0; j < 3; j++) {
        const result = await fetchTokenPrice(
          "ethereum",
          transactions[i].timeStamp
        );
        if (result) {
          price = result;
          break;
        } else {
          await sleep(5000);
        }
      }
      result.push({
        date: new Date(transactions[i].timeStamp * 1000),
        type:
          transactions[i].to.toLowerCase() === tokenAddress.toLowerCase()
            ? "Buy"
            : "Sell",
        amount:
          parseFloat(transactions[i].value) /
          Math.pow(10, transactions[i].tokenDecimal),
        portfolio: transactions[i].from,
        price,
      });
    }

    res.json({
      list: result,
      symbol: transactions[0]?.tokenSymbol,
      total: transactions.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
