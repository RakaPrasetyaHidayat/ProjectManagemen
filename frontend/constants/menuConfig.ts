import { DashboardOutlined, ProjectOutlined, TeamOutlined, HistoryOutlined, FileTextOutlined } from "@ant-design/icons";

export const managerMenuItems = [
  { key: "/dashboard", icon: DashboardOutlined, label: "Dashboard" },
  { key: "/projects", icon: ProjectOutlined, label: "Projects", children: [] },
  { key: "/users", icon: TeamOutlined, label: "Users" },
  { key: "/logs", icon: HistoryOutlined, label: "Logs" },
];

export const staffMenuItems = [
  { key: "/dashboard", icon: DashboardOutlined, label: "Dashboard" },
  { key: "/projects", icon: ProjectOutlined, label: "Projects", children: [] },
  { key: "/notes", icon: FileTextOutlined, label: "Notes" },
];
