import React, { useState, useEffect } from "react";
import {
  formatNumber,
  getLiquidityClassName,
  formatLiquidityFriendly,
} from "../utils/number";
import moment from "moment";
import { io } from "socket.io-client";
const SOCKET_URL = "http://localhost:5000";

// Configuration de moment.js en français
moment.locale("fr");

const ProjectList = () => {
  const [daysMin, setDaysMin] = useState(0);
  const [daysMax, setDaysMax] = useState(7);
  const [liquidityMin, setLiquidityMin] = useState(0);
  const [liquidityMax, setLiquidityMax] = useState(10);
  const [tokens, setTokens] = useState([]);
  const [searchInProgress, setSearchInProgress] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketConnection = io(SOCKET_URL);
    setSocket(socketConnection);

    socketConnection.on("searchToken", (token) => {
      setTokens((prevTokens) => [...prevTokens, token]);
    });

    socketConnection.on("searchComplete", () => {
      setSearchInProgress(false);
      console.log("Search complete");
    });

    socketConnection.on("searchError", (error) => {
      setSearchInProgress(false);
      console.error("Search error:", error);
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const startSearch = () => {
    if (!socket) return;
    setTokens([]);
    setSearchInProgress(true);
    socket.emit("startSearch", {
      daysMin,
      daysMax,
      liquidityMin,
      liquidityMax,
    });
  };

  const stopSearch = () => {
    socket.emit("stopSearch");
    setSearchInProgress(true);
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
          <button onClick={startSearch} disabled={searchInProgress}>
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
