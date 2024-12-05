import React from "react";
import { Modal, Table, Button } from "antd";

const BDDModal = ({ isOpen, onClose, tokens, onRename, onRemove }) => {
  const columns = [
    { title: "NAME", fixed: "left", dataIndex: "name", key: "name" },
    {
      title: "Date Heure",
      dataIndex: "datetime",
      key: "datetime",
    },
    {
      title: "Token Address",
      dataIndex: "tokenAddress",
      key: "tokenAddress",
    },
    {
      title: "Wallet Add Liquidity",
      dataIndex: "walletAddLiquidity",
      key: "walletAddLiquidity",
    },
    {
      title: "Wallet First Transaction",
      dataIndex: "walletFirstTransaction",
      key: "walletFirstTransaction",
    },
    {
      title: "Name Wallet Add Liquidity",
      dataIndex: "nameWalletAddLiquidity",
      key: "nameWalletAddLiquidity",
    },
    {
      title: "Name Wallet First Transaction",
      dataIndex: "nameWalletFirstTransaction",
      key: "nameWalletFirstTransaction",
    },
    {
      title: "Actions",
      fixed: "right",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            color="primary"
            variant="solid"
            onClick={(e) => {
              e.stopPropagation();
              onRename(record);
            }}
          >
            Rename
          </Button>
          <Button
            color="danger"
            variant="solid"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(record);
            }}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="BDD"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width="80%"
      centered
    >
      <Table
        columns={columns}
        dataSource={tokens}
        rowKey={(record) => record._id}
        style={{ overflowX: "auto" }}
        scroll={{ x: "max-content" }}
      />
    </Modal>
  );
};

export default BDDModal;
