"use client";

import { Layout, Menu, Tooltip } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectContext";
import { managerMenuItems, staffMenuItems } from "@/constants/menuConfig";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export default function AppSidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { projects } = useProjects();

  const baseMenu = user?.role === "manager" ? managerMenuItems : staffMenuItems;
  const projectChildren = projects.map((p) => ({ key: `/projects/${p.id}`, label: p.project_name }));

  const menuItems = baseMenu.map((item) =>
    item.key === "/projects"
      ? { ...item, children: projectChildren.length ? projectChildren : [{ key: "projects-empty", label: "No projects yet", disabled: true }] }
      : item
  );

  const selectedKey =
    menuItems.find((i) => pathname === i.key || (i.key !== "/projects" && pathname.startsWith(i.key + "/")))?.key ||
    projectChildren.find((c) => pathname === c.key)?.key ||
    "";

  const buildMenuItems = menuItems.map((item) => {
    const IconComponent = item.icon;
    return {
      key: item.key,
      icon: <span style={{ fontSize: 16, opacity: 0.8 }}><IconComponent /></span>,
      label: collapsed ? <Tooltip title={item.label} placement="right"><span /></Tooltip> : <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>,
      onTitleClick: item.key === "/projects" ? () => router.push("/projects") : undefined,
      children: item.children?.map((c) => ({ ...c, label: <span style={{ fontSize: 13, opacity: 0.9 }}>{c.label}</span> })),
    };
  });

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .app-sidebar { width: 72px !important; collapsedWidth: 0px !important; }
          .sidebar-footer { display: none !important; }
        }
      `}</style>
      <Layout.Sider
        width={240}
        collapsedWidth={72}
        collapsed={collapsed}
        className="app-sidebar animate-in"
        style={{
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          background: "var(--background)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ThunderboltOutlined style={{ color: "var(--background)", fontSize: 14 }} />
          </div>
          {!collapsed && <span style={{ color: "var(--foreground)", fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>TASCA</span>}
        </div>

        {!collapsed && (
          <div style={{ padding: "20px 20px 10px" }}>
            <span style={{ color: "var(--muted-foreground)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {user?.role === "manager" ? "Workspace Admin" : "Team Member"}
            </span>
          </div>
        )}

        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[selectedKey]}
          items={buildMenuItems}
          onClick={({ key }) => {
            if (key !== "projects-empty" && !key.includes("projects")) router.push(key);
            else if (key.startsWith("/projects/")) router.push(key);
          }}
          style={{ background: "transparent", border: "none", flex: 1, padding: "8px 0" }}
        />

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, color: "var(--muted-foreground)" }} onClick={() => onCollapse(!collapsed)} className="sidebar-footer">
          {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 16 }} /> : <><MenuFoldOutlined style={{ fontSize: 16 }} /><span style={{ fontSize: 13, fontWeight: 500 }}>Hide Sidebar</span></> }
        </div>
      </Layout.Sider>
    </>
  );
}