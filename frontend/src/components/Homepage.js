import React from "react";
import { Outlet, useNavigate } from "react-router";
import {
  SearchOutlined,
  LineChartOutlined,
  WalletOutlined,
  FundProjectionScreenOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
const { Content, Sider } = Layout;

const Homepage = () => {
  const navigate = useNavigate();

  const onSideClick = ({ _, key }) => {
    switch (key) {
      case "Project Detector":
        navigate("/project-detector");
        break;
      case "Visulaization":
        navigate("/visualization");
        break;
      case "Wallet Tracking":
        navigate("/wallet-tracking");
        break;
      case "New Project":
        navigate("/new-projects");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["4"]}
          items={[
            {
              key: "Project Detector",
              icon: <SearchOutlined />,
              label: "Project Detector",
            },
            {
              key: "Visulaization",
              icon: <LineChartOutlined />,
              label: "Visulaization",
            },
            {
              key: "Wallet Tracking",
              icon: <WalletOutlined />,
              label: "Wallet Tracking",
            },
            {
              key: "New Project",
              icon: <FundProjectionScreenOutlined />,
              label: "New Project",
            },
          ]}
          onClick={onSideClick}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: "0 16px 0" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              overflow: "auto",
              height: "100%",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Homepage;
