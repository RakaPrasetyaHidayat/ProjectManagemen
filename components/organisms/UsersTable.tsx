import { Avatar, Table, Space, Button, Tag, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import StatusBadge from "@/components/atoms/StatusBadge";

interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

interface UsersTableProps {
  users: User[];
  currentUserId?: number;
  page: number;
  total: number;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onChangeStatus: (id: number, status: string) => void;
  onPageChange: (page: number) => void;
}

export default function UsersTable({
  users,
  currentUserId,
  page,
  total,
  onEdit,
  onDelete,
  onChangeStatus,
  onPageChange,
}: UsersTableProps) {
  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: unknown, r: User) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={32}
            style={{
              background: "var(--primary)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {r.username[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--foreground)", fontWeight: 500, fontSize: 14 }}>{r.username}</span>
              {r.id === currentUserId && <Tag className="text-small" style={{ margin: 0, borderRadius: 4 }}>You</Tag>}
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              ID: {r.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (r: string) => (
        <span className="text-muted" style={{ textTransform: "capitalize", fontSize: 13 }}>
          {r === "manager" ? "Administrator" : "Staff Member"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => <span className="text-muted" style={{ fontSize: 13 }}>{dayjs(d).format("MMM DD, YYYY")}</span>,
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      width: 160,
      render: (_: unknown, r: User) => (
        <Space size="small">
          {r.status === "Pending" && (
            <>
              <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => onChangeStatus(r.id, "Approved")} style={{ color: "#10b981" }} />
              <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => onChangeStatus(r.id, "Rejected")} danger />
            </>
          )}
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(r)} />
          <Popconfirm
            title="Remove user account?"
            onConfirm={() => onDelete(r.id)}
            disabled={r.id === currentUserId}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} disabled={r.id === currentUserId} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="glass-card">
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        {/* Search can be added here if needed */}
      </div>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: onPageChange,
          position: ["bottomRight"],
          style: { paddingRight: 24, paddingBottom: 16 },
        }}
      />
    </div>
  );
}
