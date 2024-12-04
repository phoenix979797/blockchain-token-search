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
const Token = require("./model/Token");
const { default: axios } = require("axios");

dotenv.config();
connectDB();

// Configuration de moment.js en français
moment.locale("fr");

require("./utils/cronJob");

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

  let searchInProgress = false;
  let autoInProgress = false;

  socket.on(
    "startSearch",
    async ({ daysMax, daysMin, liquidityMax, liquidityMin }) => {
      console.log("Search started:", {
        daysMax,
        daysMin,
        liquidityMax,
        liquidityMin,
      });

      searchInProgress = true;

      const fromDate = moment().subtract(daysMax, "days").toISOString();
      const toDate = moment().subtract(daysMin, "days").toISOString();

      try {
        let page = 0;
        while (1) {
          const url = `${process.env.BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${fromDate}&to=${toDate}&page=${page}&pageSize=50`;
          const data = await makeApiCall(url);
          await sleep(process.env.API_RATE_LIMIT);

          if (!data.data || !data.data.results) {
            throw new Error("Format de réponse API invalide");
          }

          if (!data.data.results.length) break;

          for (let i = 0; i < data.data.results.length; i++) {
            if (!searchInProgress) {
              return;
            }
            const pool = data.data.results[i];

            if (pool && pool.address) {
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
                  let transaction_first = null;
                  if (transfer_first?.data?.result?.transfers[0]?.hash) {
                    transaction_first = await axios.post(
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
                  let transaction_next = null;
                  if (transfer_next?.data?.result?.transfers[0]?.hash) {
                    transaction_next = await axios.post(
                      `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
                      {
                        method: "eth_getTransactionByHash",
                        params: [
                          transfer_next?.data?.result?.transfers[0]?.hash,
                        ],
                      }
                    );
                    await sleep(process.env.API_RATE_LIMIT);
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
                    firstAddress:
                      transaction_first?.data?.result?.from || "N/A",
                    nextAddress: transaction_next?.data?.result?.from || "N/A",
                  };
                  socket.emit("searchToken", {
                    token: tokenCard,
                    progress: (100 / data.data.results.length) * (i + 1),
                    page,
                  });
                } else {
                  socket.emit("searchToken", {
                    progress: (100 / data.data.results.length) * (i + 1),
                    page,
                  });
                }

                await sleep(process.env.API_RATE_LIMIT);
              } catch (error) {
                console.log(error);
                await sleep(process.env.API_RATE_LIMIT);
                socket.emit("searchToken", {
                  progress: (100 / data.data.results.length) * (i + 1),
                  page,
                });
                continue;
              }
            }
          }
          page++;
        }
        socket.emit("searchComplete");
        console.log("searchComplete");
      } catch (error) {
        console.error(error);
        socket.emit("searchError", { message: error.message });
      }
    }
  );

  socket.on("stopSearch", () => {
    searchInProgress = false;
  });

  socket.on(
    "startAuto",
    async ({ daysMax, daysMin, liquidityMax, liquidityMin }) => {
      console.log("Auto started:", {
        daysMax,
        daysMin,
        liquidityMax,
        liquidityMin,
      });

      autoInProgress = true;

      const fromDate = moment().subtract(daysMax, "days").toISOString();
      const toDate = moment().subtract(daysMin, "days").toISOString();

      try {
        while (1) {
          if (!autoInProgress) {
            return;
          }
          const url = `${process.env.BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${fromDate}&to=${toDate}&page=0&pageSize=50`;
          const data = await makeApiCall(url);

          await sleep(process.env.API_RATE_LIMIT);

          if (!data.data || !data.data.results) {
            throw new Error("Format de réponse API invalide");
          }

          for (let i = 0; i < data.data.results.length; i++) {
            if (!autoInProgress) {
              return;
            }
            const pool = data.data.results[i];

            if (pool && pool.address) {
              try {
                const liquidity = await getLiquidity(pool.address);
                const holders = await getTokenHolders(
                  "ether",
                  pool.mainToken?.address
                );

                if (
                  Number(liquidity) <= liquidityMax &&
                  Number(liquidity) >= liquidityMin
                ) {
                  const transfer_first = await axios.post(
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
                        maxCount: "0x1",
                        order: "asc",
                      },
                    }
                  );

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
                        maxCount: "0x1",
                        order: "asc",
                      },
                    }
                  );

                  const transaction = await axios.post(
                    `https://eth-mainnet.g.alchemy.com/v2/${process.env.AlCHEMY_KEY}`,
                    {
                      method: "eth_getTransactionByHash",
                      params: [transfer_next?.data?.result?.transfers[0]?.hash],
                    }
                  );

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
                    firstAddress:
                      transfer_first?.data?.result?.transfers[0]?.from || "N/A",
                    nextAddress: transaction?.data?.result?.from || "N/A",
                  };
                  const token = new Token({
                    name: tokenCard.name,
                    date: tokenCard.creationDate,
                    tokenAddress: tokenCard.tokenAddress,
                    poolAddress: tokenCard.poolAddress,
                    firstAddress: tokenCard.firstAddress,
                    nextAddress: tokenCard.nextAddress,
                    dextoolsUrl: tokenCard.dextoolsUrl,
                    status: "V",
                  });
                  await token.save();
                  socket.emit("searchToken", tokenCard);
                }

                await sleep(process.env.API_RATE_LIMIT);
              } catch (error) {
                console.log(error);
                await sleep(process.env.API_RATE_LIMIT);
                continue;
              }
            }
          }
        }
        socket.emit("searchComplete");
        console.log("searchComplete");
      } catch (error) {
        console.error(error);
        socket.emit("searchError", { message: error.message });
      }
    }
  );

  socket.on("stopAuto", () => {
    autoInProgress = false;
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
