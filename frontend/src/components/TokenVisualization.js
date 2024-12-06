// App.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import TradingViewWidget from "./TradingViewWidget";
import { Table, Pagination, Spin } from "antd";

function TokenVisualization() {
  const [tokenAddress, setTokenAddress] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [symbol, setSymbol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/transaction", {
        tokenAddress,
        page,
        count: 5,
      });
      setTransactions(response?.data?.list);
      setSymbol(response?.data?.symbol);
      setTotal(response?.data?.total || 0);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchTransactions();
    })();
  }, []);

  const onPageChange = async (page) => {
    setPage(page);
    await fetchTransactions(page);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleString(), // Format date
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Portfolio",
      dataIndex: "portfolio",
      key: "portfolio",
    },
  ];

  return (
    <div className="token-visualization">
      <div className="visualization-container">
        <h1>Token Transactions</h1>
        <div style={{ marginBottom: 5 }}>
          <div className="input-group">
            <label htmlFor="tokenAddress">
              Token Address: 0x58c7cc591cb842a362e45345259932c3fcc96af4
            </label>
            <input
              id="tokenAddress"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
          </div>
          <button
            style={{ height: "100%", marginRight: 5 }}
            onClick={() => fetchTransactions()}
          >
            Fetch Transactions
          </button>
        </div>
        <TradingViewWidget symbol={symbol} />
      </div>
      {/* <div className="trade-table">
        {loading ? (
          // <div style={{ textAlign: "center", marginTop: "50px" }}>
          //   <Spin tip="Loading transactions..." />
          // </div>
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : (
          <div>
            <Table
              columns={columns}
              dataSource={transactions || []}
              rowKey={(record, index) => index} // Use the index as the row key
              pagination={false}
            />
            <Pagination
              current={page}
              total={total}
              pageSize={5}
              onChange={onPageChange}
              style={{ marginTop: "20px", textAlign: "right" }}
              showSizeChanger={false}
            />
          </div>
        )}
      </div> */}
    </div>
  );
}

export default TokenVisualization;
