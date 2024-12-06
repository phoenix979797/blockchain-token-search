const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const moment = require("moment");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const routes = require("./routes");
const {
  makeApiCall,
  getTokenHolders,
  getLiquidity,
} = require("./utils/apiUtils");
const sleep = require("./utils/sleep");
const { formatTimeAgo } = require("./utils/number");
const morgan = require("morgan");
const axios = require("axios");
const Token = require("./model/Token");
const ETHToken = require("./model/ETHToken");
const AutoSearch = require("./model/AutoSearch");

dotenv.config();
connectDB();

// Configuration de moment.js en français
moment.locale("fr");

// require("./utils/cronJob");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(morgan("combined"));
app.use("/api", routes);

// Socket.IO events
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("newToken", async () => {
    while (1) {
      try {
        const response = await makeApiCall(
          `https://public-api.dextools.io/trial/v2/token/ether/?sort=creationTime&order=asc&from=${moment(
            new Date(Number(new Date()) - 3 * 24 * 60 * 60 * 1000)
          ).format("YYYY-MM-DD hh:mm:ss")}&to=${moment().format(
            "YYYY-MM-DD hh:mm:ss"
          )}`
        );
        const tokens = response?.data?.tokens;

        for (let i = 0; i < tokens.length; i++) {
          const existingToken = await ETHToken.findOne({
            name: tokens[i].name,
            symbol: tokens[i].symbol,
          });
          if (!existingToken) {
            const liquidity = await getLiquidity(tokens[i].address);
            await sleep(process.env.API_RATE_LIMIT);
            const holders = await getTokenHolders("ether", tokens[i].address);
            await sleep(process.env.API_RATE_LIMIT);
            const newETHToken = new ETHToken({
              name: tokens[i].name,
              symbol: tokens[i].symbol,
              address: tokens[i].address,
              date: new Date(tokens[i].creationTime).toISOString(),
              liquidity,
              holders,
            });
            await newETHToken.save();
            socket.emit("newToken", {
              name: tokens[i].name,
              symbol: tokens[i].symbol,
              address: tokens[i].address,
              date: new Date(tokens[i].creationTime).toISOString(),
              liquidity,
              holders,
            });
          }
        }
      } catch (e) {
        console.log("new token error");
      }
      await sleep(30000);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

(async () => {
  while (1) {
    const autoInProgress = await AutoSearch.findOne();
    if (!autoInProgress?.isProgress) {
      await sleep(5000);
      continue;
    }

    try {
      let page = 0;
      while (1) {
        const autoInProgress = await AutoSearch.findOne();
        if (!autoInProgress?.isProgress) {
          break;
        }
        const { daysMax, daysMin } = autoInProgress;
        const fromDate = moment().subtract(daysMax, "days").toISOString();
        const toDate = moment().subtract(daysMin, "days").toISOString();
        const url = `${process.env.BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${fromDate}&to=${toDate}&page=${page}&pageSize=50`;
        const data = await makeApiCall(url);
        await sleep(process.env.API_RATE_LIMIT);

        if (!data.data || !data.data.results) {
          throw new Error("Format de réponse API invalide");
        }

        if (!data.data.results.length) {
          page = 0;
          continue;
        }

        for (let i = 0; i < data.data.results.length; i++) {
          const autoInProgress = await AutoSearch.findOne();
          if (!autoInProgress?.isProgress) {
            break;
          }
          const { liquidityMax, liquidityMin } = autoInProgress;
          const pool = data.data.results[i];

          if (pool && pool.address) {
            const duplication = await Token.findOne({
              name: pool.mainToken.name,
              tokenAddress: pool.mainToken?.address,
              datetime: moment(pool.creationTime).format("DD/MM/YYYY HH\\h mm"),
            });
            if (duplication) continue;

            try {
              const liquidity = await getLiquidity(pool.address);
              await sleep(process.env.API_RATE_LIMIT);
              const holders = await getTokenHolders(
                "ether",
                pool.mainToken?.address
              );
              await sleep(process.env.API_RATE_LIMIT);

              if (
                Number(liquidity) <= liquidityMax &&
                Number(liquidity) >= liquidityMin
              ) {
                let transfer_first = await axios.post(
                  `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
                  {
                    method: "alchemy_getAssetTransfers",
                    params: {
                      toAddress: pool.address,
                      category: [
                        "external",
                        "internal",
                        "erc20",
                        "erc721",
                        "erc1155",
                        "specialnft",
                      ],
                      maxCount: "0x2",
                      order: "asc",
                    },
                  }
                );
                await sleep(process.env.API_RATE_LIMIT);
                let transaction_add = null;
                if (transfer_first?.data?.result?.transfers[0]?.hash) {
                  transaction_add = await axios.post(
                    `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
                    {
                      method: "eth_getTransactionByHash",
                      params: [
                        transfer_first?.data?.result?.transfers[0]?.hash,
                      ],
                    }
                  );
                  await sleep(process.env.API_RATE_LIMIT);
                }

                const transfer_next = await axios.post(
                  `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
                  {
                    method: "alchemy_getAssetTransfers",
                    params: {
                      fromAddress: pool.address,
                      category: [
                        "external",
                        "internal",
                        "erc20",
                        "erc721",
                        "erc1155",
                        "specialnft",
                      ],
                      maxCount: "0x2",
                      order: "asc",
                    },
                  }
                );
                await sleep(process.env.API_RATE_LIMIT);
                let transaction_first = null;
                if (transfer_next?.data?.result?.transfers[0]?.hash) {
                  transaction_first = await axios.post(
                    `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
                    {
                      method: "eth_getTransactionByHash",
                      params: [transfer_next?.data?.result?.transfers[0]?.hash],
                    }
                  );
                  await sleep(process.env.API_RATE_LIMIT);
                }
                transaction_add = transaction_add?.data?.result;
                transaction_first = transaction_first?.data?.result;

                let add_block_time = null;
                if (transaction_add) {
                  add_block_time = await axios.post(
                    `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
                    {
                      method: "eth_getBlockByNumber",
                      params: [transaction_add.blockNumber, true],
                    }
                  );
                }

                await sleep(process.env.API_RATE_LIMIT);

                let first_block_time = null;
                if (transaction_first) {
                  first_block_time = await axios.post(
                    `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
                    {
                      method: "eth_getBlockByNumber",
                      params: [transaction_first.blockNumber, true],
                    }
                  );
                }

                const tokenCard = {
                  holders: holders !== null ? holders.toLocaleString() : "",
                  time: formatTimeAgo(pool.creationTime),
                  name: `${pool.mainToken?.name || "Inconnu"} (${
                    pool.mainToken?.symbol || "Inconnu"
                  })`,
                  dextoolsUrl: `https://www.dextools.io/app/en/ether/pair-explorer/${pool.address}`,
                  liquidity: liquidity,
                  exchange: pool.exchangeName || "N/A",
                  pair:
                    (pool.mainToken?.symbol || "Inconnu") +
                    " / " +
                    (pool.sideToken?.symbol || "Inconnu"),
                  creationDate: moment(pool.creationTime).format(
                    "DD/MM/YYYY HH:mm:ss"
                  ),
                  tokenAddress: pool.mainToken?.address || "N/A",
                  poolAddress: pool.address || "N/A",
                  addAddress: transaction_add?.from || "N/A",
                  firstAddress: transaction_first?.from || "N/A",
                };

                const dbTokens = await Token.find();
                io.emit("token", {
                  tokenCard,
                  tokenCount: dbTokens.length + 1,
                });

                const token = new Token({
                  name: pool.mainToken?.name || "Inconnu",
                  datetime: moment(pool.creationTime).format(
                    "DD/MM/YYYY HH\\h mm"
                  ),
                  tokenAddress: pool.mainToken?.address || "N/A",
                  addWallet: transaction_add?.from || "N/A",
                  walletFirstTransaction: transaction_first?.from || "N/A",
                  nameAddWallet: transaction_add
                    ? `Voleur - ${pool.mainToken?.name || "Inconnu"} - ${moment(
                        add_block_time
                          ? parseInt(add_block_time?.data?.result?.timestamp) *
                              1000
                          : new Date()
                      ).format("DD/MM/YYYY HH\\h mm")}`
                    : "N/A",
                  nameWalletFirstTransaction: transaction_first
                    ? `Voleur - ${pool.mainToken?.name || "Inconnu"} - ${moment(
                        first_block_time
                          ? parseInt(
                              first_block_time?.data?.result?.timestamp
                            ) * 1000
                          : new Date()
                      ).format("DD/MM/YYYY HH\\h mm")}`
                    : "N/A",
                  tokenCard,
                });
                await token.save();
              }

              await sleep(process.env.API_RATE_LIMIT);
            } catch (error) {
              console.log("auto search error");
              await sleep(process.env.API_RATE_LIMIT);
              continue;
            }
          }

          await sleep(process.env.API_RATE_LIMIT);
        }
        page++;
      }
    } catch (error) {
      console.log("auto search error", error);
    }
  }
})();
