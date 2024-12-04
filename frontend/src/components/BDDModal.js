import React, { useMemo } from "react";
import Modal from "react-modal";
import { useTable } from "react-table";
import moment from "moment";

Modal.setAppElement("#root");

const BDDModal = ({ isOpen, onClose, tokens, onRename, onRemove }) => {
  const columns = useMemo(
    () => [
      { Header: "Name", accessor: "name" },
      { Header: "Status", accessor: "status" },
      {
        Header: "Date",
        accessor: "date",
        Cell: ({ value }) => moment(value).format("DD/MM/YYYY HH:mm:ss"),
      },
      { Header: "Token Address", accessor: "tokenAddress" },
      { Header: "Pool Address", accessor: "poolAddress" },
      { Header: "First Address", accessor: "firstAddress" },
      { Header: "Next Address", accessor: "nextAddress" },
      {
        Header: "Actions",
        accessor: "actions",
        Cell: ({ row }) => (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={(e) => e.stopPropagation() || onRename(row.original)}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Rename
            </button>
            <button
              onClick={(e) => e.stopPropagation() || onRemove(row.original)}
              style={{
                padding: "5px 10px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ),
      },
    ],
    [onRename, onRemove]
  );

  const data = useMemo(() => tokens, [tokens]);

  const tableInstance = useTable({ columns, data });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  const handleRowClick = (url) => {
    window.open(url, "_blank", "noreferrer");
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="BDD"
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        content: {
          maxWidth: "80%",
          margin: "auto",
          padding: "20px",
          borderRadius: "8px",
        },
      }}
    >
      <h2>BDD</h2>
      <div style={{ overflowX: "auto" }}>
        <table
          {...getTableProps()}
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            border: "1px solid #ddd",
          }}
        >
          <thead>
            {headerGroups.map((headerGroup, headerIndex) => (
              <tr
                {...headerGroup.getHeaderGroupProps()}
                style={{ background: "#f5f5f5" }}
                key={headerIndex}
              >
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps()}
                    style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                    }}
                    key={column.id || column.accessor}
                  >
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, rowIndex) => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  onClick={() => handleRowClick(row.original.dextoolsUrl)}
                  style={{
                    borderBottom: "1px solid #ddd",
                    cursor: "pointer",
                    position: "relative", // For tooltip
                  }}
                  key={row.id || rowIndex}
                >
                  {row.cells.map((cell) => (
                    <td
                      {...cell.getCellProps()}
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid #ddd",
                      }}
                      key={cell.column.id || cell.index}
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        onClick={onClose}
        style={{ marginTop: "20px", padding: "10px 20px" }}
      >
        Close
      </button>
    </Modal>
  );
};

export default BDDModal;
