"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ConfigProvider, theme } from "antd";

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#2f7758",
    colorBgBase: "#0f172a",
    colorBgContainer: "#1e293b",
    colorBgElevated: "#1e293b",
    colorBorder: "#334155",
    colorText: "#f1f5f9",
    colorTextSecondary: "#94a3b8",
    colorTextPlaceholder: "#64748b",
    borderRadius: 8,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: { bodyBg: "#0f172a", siderBg: "#0f172a", headerBg: "#0f172a" },
    Menu: {
      darkItemBg: "transparent",
      darkItemColor: "#94a3b8",
      darkItemHoverColor: "#f1f5f9",
      darkItemSelectedColor: "#818cf8",
      darkItemSelectedBg: "rgba(99,102,241,0.12)",
    },
    Table: {
      headerBg: "#1e293b",
      headerColor: "#94a3b8",
      rowHoverBg: "rgba(99,102,241,0.05)",
      borderColor: "#334155",
    },
    Card: { paddingLG: 20 },
    Button: { primaryShadow: "0 4px 16px rgba(99,102,241,0.3)" },
    Modal: { contentBg: "#1e293b", headerBg: "#1e293b" },
    Form: { labelColor: "#94a3b8" },
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={darkTheme}>
      <AuthProvider>{children}</AuthProvider>
    </ConfigProvider>
  );
}
