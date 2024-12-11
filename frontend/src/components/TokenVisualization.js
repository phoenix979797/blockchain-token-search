// App.js
import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Table, Pagination } from "antd";
import moment from "moment";

function TokenVisualization() {
  const [pairAddress, setPairAddress] = useState("");
  const [transactions, setTransactions] = useState(null);
  const [symbol1, setSymbol1] = useState(null);
  const [symbol2, setSymbol2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const handleTransaction = async (page, size) => {
    try {
      const symbolResponse = await axiosInstance.get(
        "/api/transaction/symbol",
        {
          params: { pairAddress },
        }
      );

      if (symbolResponse.data?.success) {
        const { pairInfo } = symbolResponse.data.data;
        setSymbol1(pairInfo.token0.symbol);
        setSymbol2(pairInfo.token1.symbol);
        const { data } = await axiosInstance.get("/api/transaction/logs", {
          params: {
            pairAddress,
            pageNum: page,
            pageSize: size,
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

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "";

    num = Number(num);

    if (num >= 10)
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 });

    if (num >= 1) return num.toFixed(4);

    // Convert to string and remove any existing formatting
    let str = num.toString().toLowerCase();

    if (str.includes("e-")) {
      const [base, exponent] = str.split("e-");
      const zeros = parseInt(exponent) - 1;
      return (
        <>
          0.0<sub>{zeros}</sub>
          {base[0] + base.slice(2, 5)}
        </>
      );
    }

    // Handle regular decimal numbers
    if (str.includes(".")) {
      const [, decimal] = str.split(".");
      let leadingZeros = 0;

      // Count leading zeros in decimal
      for (let i = 0; i < decimal.length; i++) {
        if (decimal[i] === "0") {
          leadingZeros++;
        } else {
          break;
        }
      }

      if (leadingZeros <= 2) return `0.${decimal.slice(0, 4 + leadingZeros)}`;
      else {
        return (
          <>
            0.0<sub>{leadingZeros}</sub>
            {decimal.slice(leadingZeros, 4 + leadingZeros)}
          </>
        );
      }
    }

    return str;
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Datetime",
      dataIndex: "datetime",
      key: "datetime",
      render: (date) => moment(date).format("MMM DD HH:mm:ss"), // Format date
    },
    {
      title: "Type",
      dataIndex: "tradeType",
      key: "tradeType",
      render: (tradeType) => (
        <div className="trade-type">{tradeType.toUpperCase()}</div>
      ),
    },
    {
      title: "Price USD",
      dataIndex: "priceUSD",
      key: "priceUSD",
      render: (price) => <p>${formatNumber(price)}</p>,
    },
    {
      title: "Total USD",
      dataIndex: "totalUSD",
      key: "totalUSD",
      render: (price) => <p>${formatNumber(price)}</p>,
    },
    {
      title: "Price ETH",
      dataIndex: "priceETH",
      key: "priceETH",
      render: (price) => formatNumber(price),
    },
    {
      title: `Amount ${symbol1}`,
      dataIndex: "amountToken1",
      key: "amountToken1",
      render: (price) => formatNumber(price),
    },
    {
      title: `Amount ${symbol2}`,
      dataIndex: "amountToken2",
      key: "amountToken2",
      render: (price) => formatNumber(price),
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
              setPageNum(1) ||
              setLoading(true) ||
              handleTransaction(1, pageSize).then()
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
          <div style={{ width: "100%", height: "400px" }}>
            {pairAddress ? (
              <iframe
                id="dextools-widget"
                title="DEXTools Trading Chart"
                width="100%"
                height="100%"
                src={`https://www.dextools.io/widget-chart/en/ether/pe-light/${pairAddress}?theme=light&chartType=2&chartResolution=30&drawingToolbars=false`}
              ></iframe>
            ) : (
              <></>
            )}
          </div>
        </div>

        <div className="trade-table">
          <Table
            loading={loading}
            columns={columns}
            style={{ overflowX: "auto" }}
            scroll={{ x: "max-content" }}
            dataSource={transactions || []}
            rowKey={(record, index) =>
              record.datetime + record.priceUSD + record.maker + index
            }
            rowClassName={(record) =>
              record.tradeType === "buy" ? "buy-row" : "sell-row"
            }
            pagination={false}
          />
          <Pagination
            current={pageNum}
            total={total}
            pageSize={pageSize}
            onChange={(page, size) =>
              !loading &&
              (setPageNum(page) ||
                setPageSize(size) ||
                setLoading(true) ||
                handleTransaction(page, size).then())
            }
            style={{ marginTop: "20px", textAlign: "right", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}

export default TokenVisualization;
