import React, { useEffect, useState, useRef, useContext } from "react";
import {
  Table,
  Button,
  message,
  Form,
  Input,
  Popconfirm,
  Pagination,
  Modal,
  Space,
} from "antd";
import axiosInstance from "../utils/axiosInstance";
import moment from "moment";
import * as XLSX from "xlsx";

const EditableContext = React.createContext(null);

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({
        ...record,
        ...values,
      });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingInlineEnd: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};

const BDD = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [thieves, setThieves] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      const { data } = await axiosInstance.get("/api/token", {
        params: { pageNum, pageSize },
      });
      setTokens(data.list);
      setTotal(data.total);
      setThieves(data.thieves);
      setLoading(false);
    })();
  }, [pageNum, pageSize]);

  const handleRemove = async (token) => {
    try {
      await axiosInstance.delete(`/api/token/${token._id}`);
      const { data } = await axiosInstance.get("/api/token", {
        params: { pageNum, pageSize },
      });
      setTokens(data.list);
      setTotal(data.total);
      // Show a success notification
      message.success(`Token has been deleted successfully!`);
    } catch (error) {
      // Show an error notification
      message.error("Error deleting token. Please try again.");
    }
    setLoading(false);
  };

  const handleAdd = async (values) => {
    try {
      await axiosInstance.post("/api/token/", values);
      const { data } = await axiosInstance.get("/api/token", {
        params: { pageNum, pageSize },
      });
      setTokens(data.list);
      setTotal(data.total);
      setThieves(data.thieves);
      setAddModalOpen(false);
      message.success("Token has been added successfully!");
    } catch (error) {
      // Show an error notification
      console.log(error);
      message.error("Error saving token. Please try again.");
    }
    setLoading(false);
  };

  const handleSave = async (row) => {
    try {
      await axiosInstance.put(`/api/token/${row._id}`, row);
      const { data } = await axiosInstance.get("/api/token", {
        params: { pageNum, pageSize },
      });
      setTokens(data.list);
      setTotal(data.total);
      setThieves(data.thieves);
      message.success("Token has been changed successfully!");
    } catch (error) {
      // Show an error notification
      console.log(error);
      message.error("Error saving token. Please try again.");
    }
    setLoading(false);
  };

  const handleClear = async () => {
    try {
      await axiosInstance.delete("/api/token/all");
      setTokens([]);
      setTotal(0);
      setThieves(0);
      message.success("All Tokens have been deleted successfully!");
    } catch (error) {
      // Show an error notification
      console.log(error);
      message.error("Error deleting tokens. Please try again.");
    }
    setLoading(false);
  };

  const handleExportToExcel = async () => {
    const { data } = await axiosInstance.get("/api/token/all");
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert the data into a worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Write the workbook to a file and trigger download
    XLSX.writeFile(wb, "BDD.xlsx");
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const defaultColumns = [
    { title: "NAME", fixed: "left", dataIndex: "name", key: "name" },
    {
      title: "Date Heure",
      dataIndex: "datetime",
      key: "datetime",
      editable: true,
    },
    {
      title: "Token Address",
      dataIndex: "tokenAddress",
      key: "tokenAddress",
    },
    {
      title: "Add wallet or a list of wallets",
      dataIndex: "addWallet",
      key: "addWallet",
      editable: true,
    },
    {
      title: "Wallet First Transaction",
      dataIndex: "walletFirstTransaction",
      key: "walletFirstTransaction",
      editable: true,
    },
    {
      title: "Name Add Wallet",
      dataIndex: "nameAddWallet",
      key: "nameAddWallet",
      editable: true,
    },
    {
      title: "Name Wallet First Transaction",
      dataIndex: "nameWalletFirstTransaction",
      key: "nameWalletFirstTransaction",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        tokens.length >= 1 ? (
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => setLoading(true) || handleRemove(record)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: (row) => setLoading(true) || handleSave(row).then(),
      }),
    };
  });

  return (
    <div className="bdd">
      <h2>There are {thieves} thieves in the database.</h2>
      <Space
        style={{
          marginBottom: 16,
        }}
      >
        <Button
          onClick={() =>
            form.setFieldsValue({
              datetime: moment().format("DD/MM/YYYY hh\\h mm"),
              addWallet: "",
              walletFirstTransaction: "",
              nameAddWallet: `THIEF - ${moment().format(
                "DD/MM/YYYY hh\\h mm"
              )}`,
            }) || setAddModalOpen(true)
          }
          type="primary"
        >
          Add a wallet
        </Button>
        <Button
          onClick={handleExportToExcel}
          color="primary"
          variant="outlined"
        >
          Export
        </Button>
        <Popconfirm
          title="Sure to delete?"
          onConfirm={() => setLoading(true) || handleClear().then()}
        >
          <Button danger>Delete Everything</Button>
        </Popconfirm>
      </Space>
      <Table
        columns={columns}
        dataSource={tokens}
        rowKey={(record) => record._id}
        style={{ overflowX: "auto" }}
        scroll={{ x: "max-content" }}
        loading={loading}
        components={components}
        rowClassName={() => "editable-row"}
        bordered
        pagination={false}
      />
      <Pagination
        current={pageNum}
        total={total}
        pageSize={pageSize}
        onChange={(page, size) => setPageNum(page) || setPageSize(size)}
        style={{ marginTop: "20px", textAlign: "right", display: "block" }}
      />
      <Modal
        title="Add Wallet"
        open={addModalOpen}
        okText="Add"
        onCancel={() => setAddModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          layout="vertical"
          form={form}
          name="add"
          onFinish={(values) => setLoading(true) || handleAdd(values).then()}
        >
          <Form.Item
            label="Date Heure"
            name="datetime"
            rules={[
              {
                required: true,
                message: "Please input datetime!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Add wallet or a list of wallets"
            name="addWallet"
            rules={[
              {
                required: true,
                message: "Please input Add wallet or a list of wallets!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Wallet First Transaction"
            name="walletFirstTransaction"
            rules={[
              {
                required: true,
                message: "Please input Wallet First Transaction!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Name Add Wallet"
            name="nameAddWallet"
            rules={[
              {
                required: true,
                message: "Please input your Name Add Wallet!",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BDD;
