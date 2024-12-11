// client/src/components/WalletTable.js
import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Table, Button, Popconfirm, message } from "antd";
import WalletStatsModal from "./WalletStatsModal";
import WalletRegisterModal from "./WalletRegisterModal";

const WalletTable = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);

  const fetchWallets = async () => {
    try {
      const response = await axiosInstance.get("/api/wallets"); // Assuming you have an endpoint to get all wallets
      setWallets(response.data);
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet data from the server
  useEffect(() => {
    fetchWallets();
  }, []);

  // Handle toggling the wallet's status
  const handleToggleStatus = async (walletId, currentStatus) => {
    try {
      await axiosInstance.patch(`/api/wallets/${walletId}/status`);
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
    fetchWallets();
    setIsRegisterModalVisible(false);
  };

  const handleRemoveWallet = async (walletId) => {
    try {
      const result = await fetch(`/api/wallets/${walletId}`, {
        method: "DELETE",
      });
      message.success(result?.message || "");
      fetchWallets(); // Refresh wallet list after removal
    } catch (error) {
      console.error("Error removing wallet:", error);
      message.error("Failed to remove wallet. Please try again.");
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
      title: "Active",
      dataIndex: "active",
      key: "active",
      render: (value, record) => (
        <Popconfirm
          title={`Are you sure you want to ${
            value ? "deactivate" : "activate"
          } this wallet?`}
          onConfirm={() => handleToggleStatus(record._id, value)}
          okText="Yes"
          cancelText="No"
        >
          <Button color={value ? "primary" : "danger"} variant="outlined">
            {value ? "Activated" : "DeActivated"}
          </Button>
        </Popconfirm>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button type="primary" onClick={() => showStatsModal(record._id)}>
            View Stats
          </Button>
          <Popconfirm
            title="Are you sure you want to remove this wallet?"
            onConfirm={() => handleRemoveWallet(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger style={{ marginLeft: "10px" }}>
              Remove Wallet
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="wallet">
      <h3>Manage Wallets</h3>
      <Button type="primary" onClick={() => setIsRegisterModalVisible(true)}>
        Register Wallet
      </Button>

      <Table
        loading={loading}
        columns={columns}
        dataSource={wallets}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        style={{ marginTop: 10 }}
      />

      <WalletStatsModal
        walletId={selectedWalletId}
        visible={isStatsModalVisible}
        onClose={hideStatsModal}
      />

      <WalletRegisterModal
        visible={isRegisterModalVisible}
        onOk={handleRegisterWallet}
        onClose={() => setIsRegisterModalVisible(false)}
      />
    </div>
  );
};

export default WalletTable;
