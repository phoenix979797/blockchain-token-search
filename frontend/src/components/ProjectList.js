import React, { useState } from "react";
import {
  CORS_PROXY,
  API_KEY,
  BASE_URL,
  API_RATE_LIMIT,
} from "../constants/api";
import {
  formatNumber,
  formatTimeAgo,
  getLiquidityClassName,
  formatLiquidityFriendly,
} from "../utils/number";
import axios from "axios";
import moment from "moment";

// Configuration de moment.js en français
moment.locale("fr");

const ProjectList = () => {
  const [daysMin, setDaysMin] = useState(0);
  const [daysMax, setDaysMax] = useState(7);
  const [liquidityMin, setLiquidityMin] = useState(0);
  const [liquidityMax, setLiquidityMax] = useState(10);
  const [tokens, setTokens] = useState([]);
  const [searchInProgress, setSearchInProgress] = useState(false);

  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const makeApiCall = async (url) => {
    const proxyUrl = CORS_PROXY + url;

    try {
      const response = await axios(proxyUrl, {
        headers: {
          "X-API-KEY": API_KEY,
          accept: "application/json",
          origin: window.location.origin,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP! statut: ${response.status}`);
      }

      const text = await response.text();

      try {
        const data = JSON.parse(text);
        return data;
      } catch (e) {
        throw new Error(`Erreur de parsing JSON : ${e.message}`);
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const getTokenHolders = async (chain, address, retryCount = 0) => {
    try {
      const data = await makeApiCall(
        `${BASE_URL}/v2/token/${chain}/${address}/info`
      );
      const holders = data?.data?.holders;

      if (holders === undefined || holders === null) {
        throw new Error("Données de holders non trouvées");
      }

      return holders;
    } catch (error) {
      if (retryCount < 2) {
        await sleep(API_RATE_LIMIT);
        return getTokenHolders(chain, address, retryCount + 1);
      }

      return null;
    }
  };

  const getLiquidity = async (poolAddress, retryCount = 0) => {
    try {
      const data = await makeApiCall(
        `${BASE_URL}/v2/pool/ether/${poolAddress}/liquidity`
      );
      return data?.data?.liquidity || 0;
    } catch (error) {
      if (retryCount < 2) {
        await sleep(API_RATE_LIMIT);
        return getLiquidity(poolAddress, retryCount + 1);
      }
      throw error;
    }
  };

  const stopSearch = () => {
    setSearchInProgress(false);
  };

  const searchTokens = async () => {
    if (searchInProgress) return;
    setSearchInProgress(true);
    await searchTokensProgress();
  };

  const searchTokensProgress = async () => {
    try {
      const fromDate = moment().subtract(daysMax, "days").toISOString();
      const toDate = moment().subtract(daysMin, "days").toISOString();

      const url = `${BASE_URL}/v2/pool/ether?sort=creationTime&order=desc&from=${fromDate}&to=${toDate}&page=0&pageSize=50`;
      const data = await makeApiCall(url);
      await sleep(API_RATE_LIMIT);

      if (!data.data || !data.data.results) {
        throw new Error("Format de réponse API invalide");
      }

      let matchingPools = 0;

      for (let i = 0; i < data.data.results.length; i++) {
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
              matchingPools++;

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
              setTokens([...tokens, tokenCard]);
            }

            await sleep(API_RATE_LIMIT);
          } catch (error) {
            await sleep(API_RATE_LIMIT);
            continue;
          }
        }
      }

      if (matchingPools === 0) {
      }
    } catch (error) {
      console.error("Erreur de recherche :", error);
    } finally {
      setSearchInProgress(false);
    }
  };

  return (
    <div>
      <div className="search-container">
        <h1>Token Search</h1>
        <div className="proxy-setup">
          <h3>⚠️ System Requirements</h3>
          <div className="step">
            <span className="step-number">1.</span> First enable CORS proxy:
            <button
              onClick={() =>
                window.open(
                  "https://cors-anywhere.herokuapp.com/corsdemo",
                  "_blank"
                )
              }
            >
              Enable CORS proxy
            </button>
          </div>
        </div>

        <div className="api-info">
          Note: Due to API limitations (1 call/second), searching may take some
          time.
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            flexWrap: "wrap",
          }}
        >
          <div className="input-group">
            <label htmlFor="daysMin">Minimum token age (days):</label>
            <input
              id="daysMin"
              type="number"
              min="0"
              value={daysMin}
              onChange={setDaysMin}
            />
          </div>
          <div className="input-group">
            <label htmlFor="daysMax">Maximum token age (days):</label>
            <input
              id="daysMax"
              type="number"
              min="0"
              value={daysMax}
              onChange={setDaysMax}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            flexWrap: "wrap",
          }}
        >
          <div className="input-group">
            <label htmlFor="liquidityMin">Minimum Liquidity (USD):</label>
            <input
              id="liquidityMin"
              type="number"
              min="0"
              value={liquidityMin}
              onChange={setLiquidityMin}
            />
          </div>
          <div className="input-group">
            <label htmlFor="liquidityMax">Maximum Liquidity (USD):</label>
            <input
              id="liquidityMax"
              type="number"
              min="0"
              value={liquidityMax}
              onChange={setLiquidityMax}
            />
          </div>
        </div>
        <div className="button-group">
          <button onClick={searchTokens} disabled={searchInProgress}>
            To research
          </button>
          <button
            onClick={stopSearch}
            style={{ display: searchInProgress ? "inline-block" : "none" }}
          >
            Stop
          </button>
        </div>
      </div>

      <div className="results">
        {tokens.map((token) => (
          <div className="token-card" key={token.name}>
            <div className="time-badge">{token.time}</div>
            <div className="token-header">
              <h3 className="token-name">
                {token.name}
                {token.holders && (
                  <span className="holders-badge">{token.holders}</span>
                )}
              </h3>
              <div className="token-links">
                <a
                  href={token.dextoolsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="token-link"
                >
                  See on DexTools
                </a>
              </div>
            </div>
            <div className="token-info">
              <div className="info-item">
                <div className="info-label">Liquidity</div>
                <div
                  className={`info-value ${getLiquidityClassName(
                    token.liquidity
                  )} liquidity-value`}
                  data-full-value={formatNumber(token.liquidity)}
                >
                  {formatLiquidityFriendly(token.liquidity)}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Exchange</div>
                <div className="info-value">{token.exchange}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Pair</div>
                <div className="info-value">{token.pair}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Creation date</div>
                <div className="info-value">{token.creationDate}</div>
              </div>
            </div>
            <div className="token-info" style={{ marginTop: 15 }}>
              <div className="info-item">
                <div className="info-label">Token Address</div>
                <div className="info-value address">{token.tokenAddress}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Pool Address</div>
                <div className="info-value address">{token.poolAddress}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="debug-info"></div>
    </div>
  );
};

export default ProjectList;
