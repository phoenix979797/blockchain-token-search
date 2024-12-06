import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./components/Homepage";
import TokenSearch from "./components/TokenSearch";
import TokenVisualization from "./components/TokenVisualization";
import WalletTracking from "./components/WalletTracking";
import NewProjects from "./components/NewProjects";
import BDD from "./components/BDD";
import "./style/base.scss";

const App = () => {
  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />}>
            <Route path="/" element={<TokenSearch />} />
            <Route path="/project-detector" element={<TokenSearch />} />
            <Route path="/bdd" element={<BDD />} />
            <Route path="/visualization" element={<TokenVisualization />} />
            <Route path="/wallet-tracking" element={<WalletTracking />} />
            <Route path="/new-projects" element={<NewProjects />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
};

export default App;
