const ethers = require("ethers");
const axios = require("axios");
const sleep = require("../utils/sleep");
const Token = require("../model/Token");

// Basic ERC20 ABI for getting symbol
const ERC20_ABI = [
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

const getSymbolFromPair = async (pairAddress) => {
  try {
    // ABI for Uniswap V2 Pair
    const PAIR_ABI = [
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
    ];

    // Create provider with Infura URL
    const provider = new ethers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${process.env.MAINNET_KEY}`
    );

    // Create contract instance for the pair
    const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);

    // Get token0 and token1 addresses
    const [token0Address, token1Address] = await Promise.all([
      pairContract.token0(),
      pairContract.token1(),
    ]);

    // Create contract instances for both tokens
    const token0Contract = new ethers.Contract(
      token0Address,
      ERC20_ABI,
      provider
    );
    const token1Contract = new ethers.Contract(
      token1Address,
      ERC20_ABI,
      provider
    );

    // Get symbols for both tokens
    const [symbol0, symbol1] = await Promise.all([
      token0Contract.symbol(),
      token1Contract.symbol(),
    ]);

    return {
      token0: {
        address: token0Address,
        symbol: symbol0,
      },
      token1: {
        address: token1Address,
        symbol: symbol1,
      },
    };
  } catch (error) {
    console.error("Error getting pair symbols:", error);
    throw error;
  }
};

exports.getSymbol = async (req, res) => {
  try {
    const { pairAddress } = req.query;

    if (!pairAddress) {
      return res.status(400).json({ error: "Pair address is required" });
    }

    if (!process.env.MAINNET_KEY) {
      throw new Error("MAINNET_KEY environment variable is not set");
    }

    const pairInfo = await getSymbolFromPair(pairAddress);

    res.json({
      success: true,
      data: {
        pairInfo,
        tradingViewSymbol: `${pairInfo.token0.symbol}${pairInfo.token1.symbol}`,
      },
    });
  } catch (error) {
    console.error("Error in getSymbol:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch token symbols",
    });
  }
};

exports.getLogs = async (req, res) => {
  const { pairAddress, pageNum, pageSize } = req.query;
  try {
    const provider = new ethers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${process.env.MAINNET_KEY}`
    );

    // First get the token addresses from the pair
    const PAIR_ABI = [
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
    ];

    const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);

    // Get token addresses
    const [token0Address, token1Address] = await Promise.all([
      pairContract.token0(),
      pairContract.token1(),
    ]);

    // Create token contracts
    const token0Contract = new ethers.Contract(
      token0Address,
      ERC20_ABI,
      provider
    );
    const token1Contract = new ethers.Contract(
      token1Address,
      ERC20_ABI,
      provider
    );

    // Get decimals for both tokens
    const [decimals0, decimals1] = await Promise.all([
      token0Contract.decimals(),
      token1Contract.decimals(),
    ]);

    let logs = 0;
    try {
      logs = await provider.getLogs({
        address: pairAddress,
        topics: [
          ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)"),
        ],
        fromBlock: 0, // Replace with specific block for efficiency
        toBlock: "latest",
        limit: 9999,
      });
    } catch (e) {
      console.log("error", {
        fromBlock: e?.error?.data?.from,
        toBlock: e?.error?.data?.to,
      });
      logs = await provider.getLogs({
        address: pairAddress,
        topics: [
          ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)"),
        ],
        fromBlock: e?.error?.data?.from,
        toBlock: e?.error?.data?.to,
        limit: 9999,
      });
    }
    console.log(logs?.length);
    // Fetch real-time ETH/USD price
    async function fetchETHUSDPrice() {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      return data.ethereum.usd;
    }

    const ethUSDPrice = await fetchETHUSDPrice();
    // const ethUSDPrice = 1474.26;
    console.log(ethUSDPrice);

    const token = await Token.findOne({
      tokenAddress: token0Address.toLowerCase(),
      "tokenCard.poolAddress": pairAddress.toLowerCase(),
    });

    logs.reverse();
    const result = [];
    for (
      let i = (pageNum - 1) * pageSize;
      i < (pageNum * pageSize < logs.length ? pageNum * pageSize : logs.length);
      i++
    ) {
      // Decode data field (amounts)
      const abiCoder = new ethers.AbiCoder();
      const [amount0In, amount1In, amount0Out, amount1Out] = abiCoder.decode(
        ["uint256", "uint256", "uint256", "uint256"],
        logs[i].data
      );

      // Decode topics (addresses)
      const sender = `0x${logs[i].topics[1].slice(26)}`;
      const to = `0x${logs[i].topics[2].slice(26)}`;

      // Token details
      const DECIMALS_TOKEN1 = Number(decimals0);
      const DECIMALS_TOKEN2 = Number(decimals1);

      // Calculate trade details
      let tradeType,
        priceUSD,
        priceETH,
        totalETH,
        totalUSD,
        amountToken1,
        amountToken2;

      if (amount0In > 0n && amount1Out > 0n) {
        // Token2 -> Token1 (sell)
        tradeType = "sell";
        priceETH = Number(amount1Out) / Number(amount0In);
        amountToken1 = Number(amount1Out) / 10 ** DECIMALS_TOKEN1;
        amountToken2 = Number(amount0In) / 10 ** DECIMALS_TOKEN2;
      } else if (amount1In > 0n && amount0Out > 0n) {
        // Token1 -> Token2 (buy)
        tradeType = "buy";
        priceETH = Number(amount1In) / Number(amount0Out);
        amountToken1 = Number(amount1In) / 10 ** DECIMALS_TOKEN1;
        amountToken2 = Number(amount0Out) / 10 ** DECIMALS_TOKEN2;
      }

      // Calculate totals
      totalETH = priceETH * amountToken2;
      totalUSD = totalETH * ethUSDPrice;

      // Fetch block timestamp for datetime (requires provider)
      async function getBlockTimestamp(blockNumber) {
        const provider = new ethers.JsonRpcProvider(
          `https://mainnet.infura.io/v3/${process.env.MAINNET_KEY}`
        );
        const block = await provider.getBlock(blockNumber);
        return new Date(block.timestamp * 1000).toISOString();
      }

      const datetime = await getBlockTimestamp(logs[i].blockNumber);
      priceUSD = priceETH * ethUSDPrice;

      transaction = await axios.post(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
        {
          method: "eth_getTransactionByHash",
          params: [logs[i].transactionHash],
        }
      );
      await sleep(process.env.API_RATE_LIMIT);

      let rate = amountToken1.toString().split(".")[0].length - 1;

      const maker = transaction?.data?.result?.from;

      result.push({
        datetime,
        tradeType,
        priceUSD: priceUSD.toFixed(18) * 10 ** -rate,
        priceETH: priceETH.toFixed(18) * 10 ** -rate,
        totalETH: totalETH.toFixed(18), // Total in ETH
        totalUSD: totalUSD.toFixed(18), // Total in USD
        amountToken2: amountToken1.toFixed(18) * 10 ** -rate,
        amountToken1: amountToken2.toFixed(18) * 10 ** rate,
        maker,
        sender,
        to,
        hash: logs[i].hash,
        transactionHash: logs[i].transactionHash,
        name:
          token?.addWallet == maker
            ? token?.nameAddWallet
            : token?.walletFirstTransaction == maker
            ? token?.nameWalletFirstTransaction
            : "",
      });
    }

    res.json({ list: result, total: logs.length });
  } catch (error) {
    console.error("Error in getLogs:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch logs",
    });
  }
};
