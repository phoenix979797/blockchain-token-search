import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  formatNumber,
  getLiquidityClassName,
  formatLiquidityFriendly,
} from "../utils/number";
import moment from "moment";
import { io } from "socket.io-client";
import axiosInstance from "../utils/axiosInstance";
import { Button, Alert } from "antd";

// Configuration de moment.js en français
moment.locale("fr");

const TokenSearch = () => {
  const navigate = useNavigate();
  const [daysMin, setDaysMin] = useState(0);
  const [daysMax, setDaysMax] = useState(7);
  const [liquidityMin, setLiquidityMin] = useState(0);
  const [liquidityMax, setLiquidityMax] = useState(10);
  const [tokens, setTokens] = useState([]);
  const [autoInProgress, setAutoInProgress] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  useEffect(() => {
    const socketConnection = io("http://localhost:5000");

    socketConnection.on("token", ({ tokenCard, tokenCount }) => {
      if (tokenCard) {
        setTokens((prevTokens) => [...prevTokens, tokenCard]);
      }
      setTokenCount(tokenCount || 0);
    });

    (async () => {
      const { data } = await axiosInstance.get("/api/search");
      setLiquidityMin(data?.liquidityMin || 0);
      setLiquidityMax(data?.liquidityMax || 10);
      setDaysMin(data?.daysMin || 0);
      setDaysMax(data?.daysMax || 7);
      setTokenCount(data?.tokenCount || 0);
      setAutoInProgress(!!data?.isProgress);
      setTokens(data?.tokenList?.map((t) => t.tokenCard) || []);
    })();

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const handleAutomation = async () => {
    await axiosInstance.post("/api/search", {
      daysMin,
      daysMax,
      liquidityMin,
      liquidityMax,
      isProgress: !autoInProgress,
    });
    setAutoInProgress(!autoInProgress);
  };

  return (
    <div className="token-search">
      <div className="search-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>Token Search </h1>
          <div>
            <Button
              type="primary"
              style={{ height: "100%", marginRight: 5 }}
              onClick={handleAutomation}
            >
              {autoInProgress ? "Stop" : "Start"} Automation
            </Button>
            <Button
              type="primary"
              style={{ height: "100%" }}
              onClick={() => navigate("/bdd")}
            >
              Access BDD
            </Button>
          </div>
        </div>

        <Alert
          message="Note: Due to API limitations (1 call/second), searching may take some time."
          type="info"
          showIcon
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            flexWrap: "wrap",
            marginTop: 10,
          }}
        >
          <div className="input-group">
            <label htmlFor="daysMin">Minimum token age (days):</label>
            <input
              id="daysMin"
              type="number"
              min="0"
              value={daysMin}
              onChange={(e) => setDaysMin(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="daysMax">Maximum token age (days):</label>
            <input
              id="daysMax"
              type="number"
              min="0"
              value={daysMax}
              onChange={(e) => setDaysMax(e.target.value)}
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
              onChange={(e) => setLiquidityMin(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="liquidityMax">Maximum Liquidity (USD):</label>
            <input
              id="liquidityMax"
              type="number"
              min="0"
              value={liquidityMax}
              onChange={(e) => setLiquidityMax(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="results">
        {tokens.map((token, index) => (
          <div className="token-card" key={token.name + index}>
            <div className="time-badge">{token.time}</div>
            <div className="token-header">
              <h3 className="token-name">
                {token.name}
                {token.holders && (
                  <span className="holders-badge">{token.holders} holders</span>
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
            <div className="token-info" style={{ marginTop: 15 }}>
              <div className="info-item">
                <div className="info-label">Add Address</div>
                <div className="info-value address">{token.addAddress}</div>
              </div>
              <div className="info-item">
                <div className="info-label">First Address</div>
                <div className="info-value address">{token.firstAddress}</div>
              </div>
            </div>
          </div>
        ))}
        {autoInProgress ? (
          <div className="token-card">
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>Searching Tokens...</p>
              <p>({tokenCount} Tokens are searched already)</p>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default TokenSearch;
