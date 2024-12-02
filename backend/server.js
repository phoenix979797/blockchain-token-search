const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const moment = require("moment");
const cors = require("cors");
const connectDB = require("./config/db");
const routes = require("./routes");
const { BASE_URL, API_RATE_LIMIT } = require("./constants/api");
const {
  makeApiCall,
  getTokenHolders,
  getLiquidity,
} = require("./utils/apiUtils");
const sleep = require("./utils/sleep");
const { formatTimeAgo } = require("./utils/number");

dotenv.config();
connectDB();

// Configuration de moment.js en français
moment.locale("fr");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now
  },
});

app.use(cors());
app.use(express.json());
app.use("/api", routes);

// Socket.IO events
io.on("connection", (socket) => {
  console.log("New client connected");

  let searchInProgress = false;

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
        const url = `${BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${fromDate}&to=${toDate}&page=0&pageSize=50`;
        const data = await makeApiCall(url);
        console.log(data);
        await sleep(API_RATE_LIMIT);

        if (!data.data || !data.data.results) {
          throw new Error("Format de réponse API invalide");
        }

        for (let i = 0; i < data.data.results.length; i++) {
          if (!searchInProgress) {
            return;
          }
          const pool = data.data.results[i];

          if (pool && pool.address) {
            console.log(pool);
            try {
              const liquidity = await getLiquidity(pool.address);
              const holders = await getTokenHolders(
                "ether",
                pool.mainToken?.address
              );

              console.log(liquidity);

              if (
                Number(liquidity) <= liquidityMax &&
                Number(liquidity) >= liquidityMin
              ) {
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
                };
                socket.emit("searchToken", tokenCard);
              }

              await sleep(API_RATE_LIMIT);
            } catch (error) {
              console.log(error);
              await sleep(API_RATE_LIMIT);
              continue;
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

  socket.on("stopSearch", () => {
    searchInProgress = false;
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
