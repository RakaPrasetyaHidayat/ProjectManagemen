"use client";

import { Avatar, Dropdown, Space, Modal } from "antd";
import type { MenuProps } from "antd";
import {
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";

interface AppHeaderProps {
  collapsed: boolean;
  title?: string;
}

export default function AppHeader({ collapsed, title }: AppHeaderProps) {
  const { user, logout } = useAuth();

  const userMenuItems: MenuProps["items"] = [
    {
      key: "username",
      label: (
        <div style={{ padding: "4px 0" }}>
          <p style={{ fontWeight: 600, color: "var(--foreground)", margin: 0 }}>{user?.username}</p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: 0, textTransform: "capitalize" }}>
            {user?.role}
          </p>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined style={{ color: "#ef4444" }} />,
      label: <span style={{ color: "#ef4444" }}>Sign out</span>,
      onClick: () => {
        Modal.confirm({
          title: "Are you sure you want to sign out?",
          content: "You will need to sign in again to access the workspace.",
          icon: <LogoutOutlined style={{ color: "#ef4444" }} />,
          okText: "Sign out",
          okType: "danger",
          cancelText: "Cancel",
          centered: true,
          onOk: logout,
        });
      },
    },
  ];

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .app-header {
            left: 0 !important;
          }
        }
      `}</style>
      <div
        className="app-header"
        style={{
          position: "fixed",
          top: 0,
          left: sidebarWidth,
          right: 0,
          height: 64,
          background: "rgba(18, 18, 18, 0.8)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(12px, 5vw, 32px)",
          zIndex: 99,
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Page title */}
        <h2
          style={{
            color: "var(--foreground)",
            fontSize: "clamp(13px, 4vw, 16px)",
            fontWeight: 500,
            margin: 0,
            letterSpacing: "-0.01em",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </h2>

      {/* User menu */}
      <Dropdown
        menu={{ items: userMenuItems }}
        placement="bottomRight"
        trigger={["click"]}
      >
        <Space
          style={{
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 8,
            transition: "all 0.2s",
          }}
          className="header-user-trigger"
        >
          <Avatar
            size={24}
            style={{
              background: "#fafafa",
              color: "#09090b",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <span
            style={{
              color: "var(--muted-foreground)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {user?.username}
          </span>
        </Space>
      </Dropdown>
    </div>
    </>
  );
}
