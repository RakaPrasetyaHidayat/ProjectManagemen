import { Table, Space, Button, Modal } from "antd";
import { EditOutlined, DeleteOutlined, ArrowRightOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface Project {
  id: number;
  project_name: string;
  created_at: string;
  users?: { username: string };
  _count?: { tasks: number };
}

interface ProjectsTableProps {
  projects: Project[];
  page: number;
  total: number;
  onEdit?: (project: Project) => void;
  onDelete?: (id: number) => void;
  onPageChange: (page: number) => void;
  isManager?: boolean;
}

export default function ProjectsTable({
  projects,
  page,
  total,
  onEdit,
  onDelete,
  onPageChange,
  isManager = false,
}: ProjectsTableProps) {
  const router = useRouter();

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Delete Project",
      icon: <ExclamationCircleOutlined style={{ color: "#ef4444" }} />,
      content: "Are you sure you want to delete this project? All associated tasks and files will be permanently removed. This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: () => onDelete?.(id),
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, render: (x: number) => <span className="text-muted" style={{ fontFamily: "monospace", fontSize: 12 }}>#{x}</span> },
    { 
      title: "Project Name", 
      dataIndex: "project_name", 
      key: "project_name", 
      render: (x: string, record: Project) => (
        <span 
          onClick={() => router.push(`/projects/${record.id}`)}
          style={{ 
            fontWeight: 500, 
            color: "var(--foreground)", 
            cursor: "pointer",
            transition: "color 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "var(--primary)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "var(--foreground)")}
        >
          {x}
        </span>
      ) 
    },
    { title: "Owner", dataIndex: ["users", "username"], key: "created_by", render: (v: string) => <span className="text-muted" style={{ fontSize: 13 }}>{v || "—"}</span> },
    { title: "Tasks", dataIndex: "taskCount", key: "tasks", render: (v: number) => <span style={{ color: "var(--primary)", fontWeight: 500 }}>{v ?? 0}</span> },
    { title: "Initiated", dataIndex: "created_at", key: "created_at", render: (d: string) => <span className="text-muted" style={{ fontSize: 13 }}>{new Date(d).toLocaleDateString()}</span> },
    ...(isManager ? [{
      title: "",
      key: "actions",
      align: "right" as const,
      width: 140,
      render: (_: unknown, record: Project) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small" 
            icon={<ArrowRightOutlined />} 
            onClick={() => router.push(`/projects/${record.id}`)}
          />
          {onEdit && <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />}
          {onDelete && (
            <Button 
              type="text" 
              size="small" 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)} 
              danger 
            />
          )}
        </Space>
      ),
    }] : [{
      title: "",
      key: "actions",
      align: "right" as const,
      width: 80,
      render: (_: unknown, record: Project) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small" 
            icon={<ArrowRightOutlined />} 
            onClick={() => router.push(`/projects/${record.id}`)}
          />
        </Space>
      ),
    }]),
  ];

  return (
    <div className="glass-card">
      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: onPageChange,
          position: ["bottomRight"],
          style: { paddingRight: 24, paddingBottom: 16 },
        }}
      />
    </div>
  );
}
