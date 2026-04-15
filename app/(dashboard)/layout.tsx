"use client";

import { useState, useEffect } from "react";
import { ConfigProvider, theme } from "antd";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { UsersProvider } from "@/context/UsersContext";
import AppSidebar from "../../components/organisms/Sidebar";
import AppHeader from "../../components/organisms/Header";
import { usePathname, useRouter } from "next/navigation";

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#fafafa",
    colorBgBase: "#09090b",
    colorBgContainer: "#09090b",
    colorBgElevated: "#18181b",
    colorBorder: "#27272a",
    colorText: "#fafafa",
    colorTextSecondary: "#a1a1aa",
    colorTextPlaceholder: "#52525b",
    borderRadius: 12,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: { 
      bodyBg: "#09090b", 
      siderBg: "#09090b", 
      headerBg: "#09090b" 
    },
    Menu: {
      darkItemBg: "transparent",
      darkItemColor: "#a1a1aa",
      darkItemHoverColor: "#fafafa",
      darkItemSelectedColor: "#fafafa",
      darkItemSelectedBg: "#18181b",
      itemSelectedBg: "#18181b",
      itemSelectedColor: "#fafafa",
    },
    Table: {
      headerBg: "transparent",
      headerColor: "#71717a",
      rowHoverBg: "rgba(39, 39, 42, 0.5)",
      borderColor: "#27272a",
    },
    Card: { paddingLG: 24, headerBg: "transparent", colorBgContainer: "#09090b" },
    Button: { 
      primaryShadow: "none", 
      fontWeight: 500,
      controlHeight: 36
    },
    Modal: { 
      contentBg: "#09090b", 
      headerBg: "transparent",
      titleColor: "#fafafa",
      paddingMD: 24
    },
    Form: { labelColor: "#a1a1aa", labelFontSize: 13 },
    Input: { 
      colorBgContainer: "#09090b", 
      colorBorder: "#27272a",
      activeBorderColor: "#fafafa", 
      hoverBorderColor: "#3f3f46" 
    },
    Select: { 
      colorBgContainer: "#09090b", 
      colorBgElevated: "#18181b",
      colorBorder: "#27272a" 
    },
    Tag: { defaultBg: "#18181b", defaultColor: "#a1a1aa", borderRadiusSM: 4 },
  },
};

// ─── Inner: Guard + Layout ────────────────────────────────────────────────────

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
        }}
      >
        <div className="loader" />
        <style>{`.loader {
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid #18181b; border-top-color: #fafafa;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Page title map
  const titleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/projects": "Projects",
    "/users": "User Management",
  };
  const pageTitle =
    Object.entries(titleMap).find(([key]) => pathname.startsWith(key))?.[1] ?? "TASCA";

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .app-sidebar {
            display: none !important;
          }
          .dashboard-main {
            margin-left: 0 !important;
          }
        }
        @media (min-width: 769px) {
          .app-sidebar {
            display: block !important;
          }
        }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#09090b" }}>
        <div className="app-sidebar">
          <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />
        </div>

        <div
          className="dashboard-main"
          style={{
            marginLeft: sidebarWidth,
            flex: 1,
            transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AppHeader collapsed={collapsed} title={pageTitle} />

          <main
            style={{
              marginTop: 64,
              padding: "clamp(12px, 5vw, 24px)",
              flex: 1,
              overflowY: "auto",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

// ─── Layout Export ────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={darkTheme}>
      <AuthProvider>
        <UsersProvider>
          <ProjectProvider>
            <DashboardInner>{children}</DashboardInner>
          </ProjectProvider>
        </UsersProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
