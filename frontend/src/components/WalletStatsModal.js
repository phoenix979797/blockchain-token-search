import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Spin } from "antd";
import axiosInstance from "../utils/axiosInstance";

const WalletStatsModal = ({ walletId, visible, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch wallet stats when the modal is opened
  useEffect(() => {
    const fetchWalletStats = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/api/stats/${walletId}`);
        console.log(data);
        setStats(data);
      } catch (error) {
        console.error("Error fetching wallet stats:", error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    if (visible && walletId) {
      fetchWalletStats();
    }
  }, [visible, walletId]);

  const columns = [
    {
      title: "Metric",
      dataIndex: "metric",
      key: "metric",
    },
    {
      title: "7 Days",
      dataIndex: "sevenDays",
      key: "sevenDays",
    },
    {
      title: "30 Days",
      dataIndex: "thirtyDays",
      key: "thirtyDays",
    },
  ];

  const statsData = stats
    ? [
        {
          key: "1",
          metric: "PnL Achieved",
          sevenDays: stats.stats7Days.pnlAchieved,
          thirtyDays: stats.stats30Days.pnlAchieved,
        },
        {
          key: "2",
          metric: "PnL Unrealized",
          sevenDays: stats.stats7Days.pnlUnrealized,
          thirtyDays: stats.stats30Days.pnlUnrealized,
        },
        {
          key: "3",
          metric: "PnL Total",
          sevenDays: stats.stats7Days.pnlTotal,
          thirtyDays: stats.stats30Days.pnlTotal,
        },
        {
          key: "4",
          metric: "Tokens Traded",
          sevenDays: stats.stats7Days.tokensTraded,
          thirtyDays: stats.stats30Days.tokensTraded,
        },
        {
          key: "5",
          metric: "Total Volume",
          sevenDays: stats.stats7Days.totalVolume,
          thirtyDays: stats.stats30Days.totalVolume,
        },
        {
          key: "6",
          metric: "Success Rate",
          sevenDays: stats.stats7Days.successRate,
          thirtyDays: stats.stats30Days.successRate,
        },
      ]
    : [];

  return (
    <Modal
      title="Wallet Statistics"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {loading ? (
        <Spin>Loading stats...</Spin>
      ) : stats ? (
        <Table
          columns={columns}
          dataSource={statsData}
          pagination={false}
          bordered
        />
      ) : (
        <p>No stats available. Please try again later.</p>
      )}
    </Modal>
  );
};

export default WalletStatsModal;
