import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./components/Homepage";
import TokenSearch from "./components/TokenSearch";
import TokenVisualization from "./components/TokenVisualization";
import WalletTracking from "./components/WalletTracking";
import "./style/base.scss";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/project-detector" element={<TokenSearch />} />
          <Route path="/visualization" element={<TokenVisualization />} />
          <Route path="/wallet-tracking" element={<WalletTracking />} />
          {/* <Route path="/new-projects" element={<NewProjects />} /> */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
