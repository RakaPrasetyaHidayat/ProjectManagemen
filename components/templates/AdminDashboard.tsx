"use client";

import { useState } from "react";
import { Row, Col, Table, Progress, Button, Modal, Form, Input, message } from "antd";
import { PlusOutlined, CheckCircleOutlined, ProjectOutlined, UserOutlined, ClockCircleOutlined } from "@ant-design/icons";
import api from "@/lib/api";
import { useProjects } from "@/context/ProjectContext";
import StatCard from "@/components/molecules/StatCard";

interface DashboardStats {
  totalTasks: number;
  totalProjects: number;
  totalUsers: number;
  tasksByStatus: { To_Do: number; On_Progress: number; Done: number; Overdue: number };
}

interface ActivityLog { id: number; actor: string; action: string; target: string; when: string; }

interface AdminDashboardProps {
  stats: DashboardStats | null;
  logs: ActivityLog[];
  roleCounts: { manager: number; staf: number };
  refreshData: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  To_Do: "To Do",
  On_Progress: "In Progress",
  Done: "Done",
  Overdue: "Overdue",
};

const STATUS_COLORS: Record<string, string> = {
  To_Do: "#f59e0b",
  On_Progress: "#3b82f6",
  Done: "#10b981",
  Overdue: "#ef4444",
};

const ROLE_COLORS: Record<string, string> = {
  manager: "#34d399",
  staf: "#10b981",
};

export default function AdminDashboard({ stats, logs, roleCounts, refreshData }: AdminDashboardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [form] = Form.useForm();
  const { refreshProjects } = useProjects();

  const onAddProject = async (values: { project_name: string }) => {
    setSavingProject(true);
    try {
      await api.post("/projects", values);
      message.success("Project created successfully");
      setModalOpen(false);
      form.resetFields();
      refreshData();
      refreshProjects();
    } catch (err) {
      message.error("Failed to create project");
    } finally {
      setSavingProject(false);
    }
  };

  const statusValues = stats?.tasksByStatus ?? { To_Do: 0, On_Progress: 0, Done: 0, Overdue: 0 };
  const statusTotal = Object.values(statusValues).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="animate-in">
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "clamp(20px, 8vw, 40px)", gap: "clamp(12px, 4vw, 20px)" }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--foreground)", fontSize: "clamp(24px, 7vw, 32px)", fontWeight: 600, letterSpacing: "-0.03em" }}>Overview</h1>
          <p style={{ margin: "clamp(4px, 2vw, 8px) 0 0", color: "var(--muted-foreground)", fontSize: "clamp(12px, 3vw, 14px)" }}>Management Control Center</p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setModalOpen(true)} 
          style={{ height: "clamp(32px, 8vw, 40px)", padding: "0 clamp(12px, 4vw, 20px)" }}
        >
          New Project
        </Button>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="All Tasks" value={stats?.totalTasks ?? 0} icon={<CheckCircleOutlined />} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Active Projects" value={stats?.totalProjects ?? 0} icon={<ProjectOutlined />} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Team Members" value={stats?.totalUsers ?? 0} icon={<UserOutlined />} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Overdue" value={stats?.tasksByStatus?.Overdue ?? 0} icon={<ClockCircleOutlined />} />
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <div className="glass-card" style={{ height: '100%', padding: "clamp(16px, 4vw, 24px)" }}>
            <h3 style={{ margin: "0 0 clamp(16px, 4vw, 24px)", color: "var(--foreground)", fontSize: "clamp(14px, 3.5vw, 16px)", fontWeight: 500 }}>Task Progression</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: "clamp(16px, 4vw, 32px)", alignItems: "center", minHeight: "clamp(140px, 40vw, 180px)" }}>
              {Object.entries(statusValues)
                .filter(([key]) => key !== "Overdue")
                .map(([key, value]) => {
                const pct = Math.round((value as number / statusTotal) * 100);
                const chartSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 70 : 100;
                return (
                  <div key={key} style={{ textAlign: "center", width: "clamp(80px, 25vw, 100px)" }}>
                    <Progress 
                      type="dashboard" 
                      percent={pct} 
                      strokeColor={STATUS_COLORS[key]} 
                      trailColor="var(--border)" 
                      size={chartSize} 
                      format={() => <span style={{ color: 'var(--foreground)', fontSize: "clamp(14px, 3vw, 20px)", fontWeight: 600}}>{value}</span>} 
                    />
                    <div style={{ marginTop: "clamp(8px, 2vw, 12px)", color: "var(--muted-foreground)", fontSize: "clamp(9px, 2vw, 11px)", fontWeight: 600, textTransform: "uppercase" }}>{STATUS_LABELS[key]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div className="glass-card" style={{ height: '100%', padding: "clamp(16px, 4vw, 24px)" }}>
            <h3 style={{ margin: "0 0 clamp(16px, 4vw, 24px)", color: "var(--foreground)", fontSize: "clamp(14px, 3.5vw, 16px)", fontWeight: 500 }}>Workforce Distribution</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 4vw, 24px)", justifyContent: "center", minHeight: "clamp(140px, 40vw, 180px)" }}>
              {Object.entries(roleCounts).map(([role, count]) => {
                const total = roleCounts.manager + roleCounts.staf || 1;
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={role}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "clamp(6px, 2vw, 8px)", color: "var(--foreground)", fontSize: "clamp(12px, 3vw, 13px)" }}>
                      <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{role}</span>
                      <span style={{ color: "var(--muted-foreground)" }}>{count} members</span>
                    </div>
                    <Progress percent={percent} strokeColor="var(--primary)" trailColor="var(--border)" strokeLinecap="round" strokeWidth={6} showInfo={false} />
                  </div>
                );
              })}
            </div>
          </div>
        </Col>
      </Row>

      <div className="glass-card" style={{ marginTop: 20 }}>
        <div style={{ padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)", borderBottom: "1px solid var(--border)" }}>
           <h3 style={{ margin: 0, color: "var(--foreground)", fontSize: "clamp(14px, 3.5vw, 16px)", fontWeight: 500 }}>Recent Activity</h3>
        </div>
        <Table
          dataSource={logs}
          columns={[
            { title: "Timestamp", dataIndex: "when", key: "when", render: (x) => <span className="text-muted" style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}>{x}</span> },
            { title: "Actor", dataIndex: "actor", key: "actor", render: (x) => <span style={{ color: "var(--foreground)", fontWeight: 500, fontSize: "clamp(11px, 2.8vw, 13px)" }}>{x}</span> },
            { title: "Action", dataIndex: "action", key: "action", render: (x) => <span style={{ color: "var(--primary)", fontSize: "clamp(11px, 2.8vw, 13px)" }}>{x}</span> },
            { title: "Target", dataIndex: "target", key: "target", render: (x) => <span className="text-muted" style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}>{x}</span> },
          ]}
          rowKey="id"
          pagination={{
            pageSize: 10,
            total: logs.length,
            showSizeChanger: false,
            showQuickJumper: false,
            simple: true,
            size: "small",
            position: ["bottomRight"]
          }}
          size="middle"
          scroll={{ x: 600 }}
        />
      </div>

      <Modal 
        title="Launch Project" 
        open={modalOpen} 
        onCancel={() => setModalOpen(false)} 
        footer={null} 
        centered
        width={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.9, 400) : 400}
      >
        <Form form={form} layout="vertical" onFinish={onAddProject} style={{ marginTop: 20 }} requiredMark={false}>
          <Form.Item 
            name="project_name" 
            label={<span className="text-muted text-small font-medium">Project Name</span>} 
            rules={[{ required: true, message: "Enter project name" }]}
          >
            <Input size="large" placeholder="e.g. Apollo Mission" />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "clamp(8px, 3vw, 12px)", marginTop: "clamp(20px, 5vw, 32px)", flexWrap: "wrap" }}>
            <Button onClick={() => setModalOpen(false)} type="text">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={savingProject}>Create Project</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
