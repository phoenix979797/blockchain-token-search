// App.js
import React, { useState } from "react";
import axios from "axios";
import { Table, Pagination } from "antd";

function TokenVisualization() {
  const [pairAddress, setPairAddress] = useState("");
  const [transactions, setTransactions] = useState(null);
  const [symbol1, setSymbol1] = useState(null);
  const [symbol2, setSymbol2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const handleTransaction = async () => {
    try {
      const symbolResponse = await axios.get("/api/transaction/symbol", {
        params: { pairAddress },
      });

      if (symbolResponse.data?.success) {
        const { pairInfo } = symbolResponse.data.data;
        setSymbol1(pairInfo.token0.symbol);
        setSymbol2(pairInfo.token1.symbol);
        const { data } = await axios.get("/api/transaction/logs", {
          params: {
            pairAddress,
            pageNum,
            pageSize,
          },
        });
        setTotal(data.total);
        setTransactions(data.list);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: "Datetime",
      dataIndex: "datetime",
      key: "datetime",
      render: (date) => new Date(date).toLocaleString(), // Format date
    },
    {
      title: "Type",
      dataIndex: "tradeType",
      key: "tradeType",
    },
    {
      title: "Price USD",
      dataIndex: "priceUSD",
      key: "priceUSD",
      render: (price) => "$" + price,
    },
    {
      title: "Total USD",
      dataIndex: "totalUSD",
      key: "totalUSD",
      render: (price) => "$" + price,
    },
    {
      title: "Price ETH",
      dataIndex: "priceETH",
      key: "priceETH",
    },
    {
      title: `Amount ${symbol1}`,
      dataIndex: "amountToken1",
      key: "amountToken1",
    },
    {
      title: `Amount ${symbol2}`,
      dataIndex: "amountToken2",
      key: "amountToken2",
    },
    {
      title: "Maker",
      dataIndex: "maker",
      key: "maker",
    },
  ];

  return (
    <div className="token-visualization">
      <div className="visualization-container">
        <h1>Token Transactions</h1>
        <div style={{ marginBottom: 5 }}>
          <div className="input-group">
            <label htmlFor="pairAddress">
              Pair Address: 0x38082885314fb4686cc91003ddad2070d9388660
            </label>
            <input
              id="pairAddress"
              value={pairAddress}
              onChange={(e) => setPairAddress(e.target.value)}
            />
          </div>
          <button
            style={{ height: "100%", marginRight: 5 }}
            onClick={() =>
              setPageNum(1) || setLoading(true) || handleTransaction().then()
            }
          >
            Fetch Transactions
          </button>
        </div>
        <div style={{ height: "500px", marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <h3>
              Price Chart - {symbol1}/{symbol2 || "Loading..."}
            </h3>
          </div>
          <iframe
            id="dextools-widget"
            title="DEXTools Trading Chart"
            width="500"
            height="400"
            src={`https://www.dextools.io/widget-chart/en/ether/pe-light/${pairAddress}?theme=light&chartType=2&chartResolution=30&drawingToolbars=false`}
          ></iframe>
        </div>

        <div className="trade-table">
          <Table
            loading={loading}
            columns={columns}
            style={{ overflowX: "auto" }}
            scroll={{ x: "max-content" }}
            dataSource={transactions || []}
            rowKey={(record) =>
              record.datetime + record.priceUSD + record.maker
            }
            pagination={false}
          />
          <Pagination
            current={pageNum}
            total={total}
            pageSize={pageSize}
            onChange={(page, size) =>
              setPageNum(page) ||
              setPageSize(size) ||
              setLoading(true) ||
              handleTransaction().then()
            }
            style={{ marginTop: "20px", textAlign: "right", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}

export default TokenVisualization;
