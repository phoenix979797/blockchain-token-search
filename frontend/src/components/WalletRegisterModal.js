import React from "react";
import { Modal, message, Form, Input } from "antd";
import axiosInstance from "../utils/axiosInstance";

const WalletRegisterModal = ({ visible, onOk, onClose }) => {
  const [form] = Form.useForm();

  const handleSave = async (values) => {
    try {
      await axiosInstance.post("/api/wallets", values);
      message.success("Register successful!");
      form.resetFields();
      onOk();
    } catch (error) {
      console.error("Error registering wallet:", error);
    }
  };

  return (
    <Modal
      title="Register Wallet"
      open={visible}
      okText="Register"
      onCancel={() => form.resetFields() || onClose()}
      okButtonProps={{
        autoFocus: true,
        htmlType: "submit",
      }}
      modalRender={(dom) => (
        <Form
          layout="vertical"
          form={form}
          name="register"
          initialValues={{
            active: true,
          }}
          clearOnDestroy
          onFinish={(values) => handleSave(values)}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label="Wallet Name"
        name="walletName"
        rules={[
          {
            required: true,
            message: "Please input your Wallet Name!",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Wallet Address"
        name="walletAddress"
        rules={[
          {
            required: true,
            message: "Please input your Wallet Address!",
          },
        ]}
      >
        <Input />
      </Form.Item>
    </Modal>
  );
};

export default WalletRegisterModal;
