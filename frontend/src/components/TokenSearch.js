import React, { useState, useEffect } from "react";
import {
  formatNumber,
  getLiquidityClassName,
  formatLiquidityFriendly,
} from "../utils/number";
import moment from "moment";
import { io } from "socket.io-client";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TokenModal from "./BDDModal";

// Configuration de moment.js en français
moment.locale("fr");

const TokenSearch = () => {
  const [daysMin, setDaysMin] = useState(0);
  const [daysMax, setDaysMax] = useState(7);
  const [liquidityMin, setLiquidityMin] = useState(0);
  const [liquidityMax, setLiquidityMax] = useState(10);
  const [tokens, setTokens] = useState([]);
  const [searchInProgress, setSearchInProgress] = useState(false);
  const [autoInProgress, setAutoInProgress] = useState(false);
  const [socket, setSocket] = useState(null);
  const [bddTokens, setBddTokens] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const socketConnection = io(process.env.SOCKET_URL);
    setSocket(socketConnection);

    socketConnection.on("searchToken", (token) => {
      if (token.token) setTokens((prevTokens) => [...prevTokens, token.token]);
      setProgress(token.progress);
      setAttempt(token.page);
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
    setProgress(0);
    setAttempt(0);
  };

  const stopSearch = () => {
    socket.emit("stopSearch");
    setSearchInProgress(false);
  };

  const hideToken = (index) => {
    const tmp = [...tokens];
    tmp.splice(index, 1);
    setTokens(tmp);
  };

  const addToken = async (index) => {
    try {
      await axios.post("/api/token", tokens[index]);

      // Show a success notification
      toast.success(`Token has been added successfully!`);
    } catch (error) {
      // Show an error notification
      toast.error("Error saving token. Please try again.");
    }
  };

  const accessBdd = async () => {
    const { data } = await axios.get("/api/token");
    setBddTokens(data);
    setIsModalOpen(true);
  };

  const addAutomation = () => {
    if (!socket) return;
    if (autoInProgress) {
      setAutoInProgress(false);
      socket.emit("stopAuto");
    } else {
      setAutoInProgress(true);
      socket.emit("startAuto", {
        daysMin,
        daysMax,
        liquidityMin,
        liquidityMax,
      });
    }
  };

  const handleRename = async (token) => {
    const newName = prompt("Enter a new name for the token:", token.name);
    if (newName) {
      try {
        await axios.put(`/api/token/${token._id}`, { name: newName });
        setBddTokens((prevTokens) =>
          prevTokens.map((t) =>
            t._id === token._id ? { ...t, name: newName } : t
          )
        );

        // Show a success notification
        toast.success(`Token name has been changed successfully!`);
      } catch (error) {
        // Show an error notification
        toast.error("Error saving token. Please try again.");
      }
    }
  };

  const handleRemove = async (token) => {
    if (window.confirm(`Are you sure you want to delete ${token.name}?`)) {
      try {
        await axios.delete(`/api/token/${token._id}`);
        setBddTokens((prevTokens) =>
          prevTokens.filter((t) => t._id !== token._id)
        );

        // Show a success notification
        toast.success(`Token has been deleted successfully!`);
      } catch (error) {
        // Show an error notification
        toast.error("Error deleting token. Please try again.");
      }
    }
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
          <h1>Token Search</h1>
          <div>
            <button
              style={{ height: "100%", marginRight: 5 }}
              onClick={addAutomation}
            >
              {autoInProgress ? "Stop" : "Start"} Automation
            </button>
            <button style={{ height: "100%" }} onClick={accessBdd}>
              Access BDD
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
        {tokens.map((token, index) => (
          <div className="token-card" key={token.name}>
            <div className="time-badge">{token.time}</div>
            <div className="operation">
              <button onClick={() => hideToken(index)}>Hide</button>
              <button onClick={() => addToken(index)}>
                {token?.bdd ? "Remove BDD" : "Add BDD"}
              </button>
            </div>
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
                <div className="info-value address">{token.firstAddress}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Next Address</div>
                <div className="info-value address">{token.nextAddress}</div>
              </div>
            </div>
          </div>
        ))}
        {searchInProgress ? (
          <div className="token-card">
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>Searching Tokens...</p>
              <p>
                Attempt {attempt + 1} - {progress}%
              </p>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
      {isModalOpen && (
        <TokenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tokens={bddTokens}
          onRename={handleRename}
          onRemove={handleRemove}
        />
      )}
      <ToastContainer />
    </div>
  );
};

export default TokenSearch;
