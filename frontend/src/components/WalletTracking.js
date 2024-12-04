// client/src/components/WalletTable.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button } from "antd";
import WalletStatsModal from "./WalletStatsModal";

const WalletTable = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);

  // Fetch wallet data from the server
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const response = await axios.get("/api/wallets"); // Assuming you have an endpoint to get all wallets
        setWallets(response.data);
      } catch (error) {
        console.error("Error fetching wallets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  // Handle toggling the wallet's status
  const handleToggleStatus = async (walletId, currentStatus) => {
    try {
      await axios.patch(`/api/wallets/${walletId}/status`);
      setWallets((prevWallets) =>
        prevWallets.map((wallet) =>
          wallet._id === walletId
            ? { ...wallet, active: !currentStatus }
            : wallet
        )
      );
    } catch (error) {
      console.error("Error toggling wallet status:", error);
    }
  };

  // Handle registration of a new wallet
  const handleRegisterWallet = async () => {
    if (!walletName || !walletAddress) {
      alert("Please provide both wallet name and address");
      return;
    }

    try {
      const newWallet = {
        walletName,
        walletAddress,
      };

      const response = await axios.post("/api/wallets", newWallet); // Assuming you have a POST route to register wallets
      setWallets((prevWallets) => [...prevWallets, response.data]); // Add the new wallet to the table
      setWalletName(""); // Reset the form fields
      setWalletAddress("");
      setIsFormVisible(false); // Hide the form after successful registration
    } catch (error) {
      console.error("Error registering wallet:", error);
    }
  };

  const showStatsModal = (walletId) => {
    setSelectedWalletId(walletId);
    setIsStatsModalVisible(true);
  };

  const hideStatsModal = () => {
    setSelectedWalletId(null);
    setIsStatsModalVisible(false);
  };

  const columns = [
    {
      title: "Wallet Name",
      dataIndex: "walletName",
      key: "walletName",
    },
    {
      title: "Wallet Address",
      dataIndex: "walletAddress",
      key: "walletAddress",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button
            type="primary"
            onClick={() => handleToggleStatus(record._id, record.active)}
          >
            {record.active ? "Deactivate" : "Activate"}
          </Button>
          <Button type="primary" onClick={() => showStatsModal(record._id)}>
            View Stats
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h3>Manage Wallets</h3>
      <button onClick={() => setIsFormVisible(true)}>Register Wallet</button>

      {isFormVisible && (
        <div>
          <h4>Register New Wallet</h4>
          <div>
            <label>
              Wallet Name:
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              Wallet Address:
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </label>
          </div>
          <button onClick={handleRegisterWallet}>Register Wallet</button>
          <button onClick={() => setIsFormVisible(false)}>Cancel</button>
        </div>
      )}

      {loading ? (
        <p>Loading wallets...</p>
      ) : (
        <Table
          columns={columns}
          dataSource={wallets}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      )}

      <WalletStatsModal
        walletId={selectedWalletId}
        visible={isStatsModalVisible}
        onClose={hideStatsModal}
      />
    </div>
  );
};

export default WalletTable;
