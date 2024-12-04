import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Dashboard</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <Link to="/project-detector">
          <button>PROJECT DETECTOR</button>
        </Link>
        <Link to="/visualization">
          <button>VISUALIZATION</button>
        </Link>
        <Link to="/wallet-tracking">
          <button>WALLET TRACKING</button>
        </Link>
        <Link to="/new-projects">
          <button>NEW PROJECTS</button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
