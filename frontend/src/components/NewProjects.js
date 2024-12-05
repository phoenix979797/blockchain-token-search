import React, { useEffect, useState } from "react";
import { Table, Button } from "antd";
import moment from "moment";
import axios from "axios";
import { io } from "socket.io-client";

const NewProjects = () => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const socketConnection = io(process.env.SOCKET_URL);

    // Fetch initial data
    const fetchTokens = async () => {
      const response = await axios.get("/api/ethtoken");
      setTokens(response.data);
    };

    fetchTokens();

    socketConnection.on("newToken", (data) => {
      setTokens((prevTokens) => [data, ...prevTokens]);
    });

    socketConnection.emit("newToken");

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const columns = [
    {
      title: "Token Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Created At",
      dataIndex: "date",
      key: "date",
      render: (createdAt) => moment(createdAt).fromNow(),
    },
    {
      title: "Token Address",
      dataIndex: "address",
      key: "address",
      render: (address) => <span>{address}</span>,
    },
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
    },
    {
      title: "Liquidity",
      dataIndex: "liquidity",
      key: "liquidity",
    },
    {
      title: "Holders",
      dataIndex: "holders",
      key: "holders",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button
            type="link"
            href={`https://www.dextools.io/app/en/ether/pair-explorer/${record.address}?t=1733342852222`}
            target="_blank"
            rel="noreferrer"
          >
            View on Dextool
          </Button>
          <Button
            type="link"
            href={`https://unibot.com/tokens/${record.address}`}
            target="_blank"
            rel="noreferrer"
          >
            Open Unibot
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="new-project">
      <h1>New Ethereum Tokens</h1>
      <Table
        dataSource={tokens.map((token) => ({ ...token, key: token.address }))}
        rowKey="name"
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default NewProjects;
