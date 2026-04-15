"use client";

import { useState } from "react";
import { Row, Col, Table, Space, Select, Button, message, Modal, Form, Input, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import StatCard from "@/components/molecules/StatCard";
import { CheckCircleOutlined, ClockCircleOutlined, ProjectOutlined } from "@ant-design/icons";

const TaskFilePreview = dynamic(() => import("@/components/TaskFilePreview"), {
  ssr: false,
  loading: () => <div>Loading preview...</div>,
});

interface TaskFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  description?: string;
  uploaded_at: string;
  uploader?: { username: string };
}


interface AssignedTask { 
  id: number; 
  task_name: string; 
  task_status: string; 
  original_status?: string;
  project?: { id: number; project_name: string }; 
  users?: { id: number; username?: string; role?: string }; 
  task_files?: TaskFile[];
}

interface ProjectSummary { id: number; project_name: string; users?: { role: string }; }

interface UserDashboardProps {
  tasks: AssignedTask[];
  projects: ProjectSummary[];
  setTasks: (tasks: AssignedTask[]) => void;
}

const STATUS_LABELS: Record<string, string> = {
  To_Do: "To Do",
  On_Progress: "Doing",
  Done: "Done",
  Overdue: "Overdue",
};

const STATUS_COLORS: Record<string, string> = {
  To_Do: "#f59e0b",
  On_Progress: "#3b82f6",
  Done: "#10b981",
  Overdue: "#ef4444",
};

export default function UserDashboard({ tasks, projects, setTasks }: UserDashboardProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<AssignedTask | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const totalAssigned = tasks.length;
  const openTasks = tasks.filter((t) => t.task_status === "To_Do" || t.task_status === "On_Progress" || t.task_status === "Overdue").length;
  const doneTasks = tasks.filter((t) => t.task_status === "Done").length;

  // Filter projects to only show those with pending tasks for the current user
  const activeProjectIds = new Set(
    tasks
      .filter(t => t.task_status !== "Done")
      .map(t => t.project?.id)
      .filter((id): id is number => id !== undefined)
  );
  
  const activeProjects = projects.filter(p => activeProjectIds.has(p.id));

  const handleUpload = async (values: { description?: string }) => {
    if (!selectedTask || fileList.length === 0) {
      message.error("Please select a file");
      return;
    }

    const file = fileList[0].originFileObj;
    if (file.size > 10 * 1024 * 1024) {
      message.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (values.description) {
      fd.append("description", values.description);
    }

    try {
      const { data } = await api.post(`/tasks/${selectedTask.id}/files`, fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      
      message.success("File uploaded successfully");
      
      // Update tasks state with new file
      const updatedTasks = tasks.map(t => {
        if (t.id === selectedTask.id) {
          return {
            ...t,
            task_files: [...(t.task_files || []), data.data]
          };
        }
        return t;
      });
      setTasks(updatedTasks);
      
      setUploadModalOpen(false);
      form.resetFields();
      setFileList([]);
    } catch (err) {
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: "clamp(20px, 8vw, 40px)" }}>
        <h1 style={{ margin: 0, color: "var(--foreground)", fontSize: "clamp(24px, 7vw, 32px)", fontWeight: 600, letterSpacing: "-0.03em" }}>Workspace</h1>
        <p style={{ margin: "clamp(4px, 2vw, 8px) 0 0", color: "var(--muted-foreground)", fontSize: "clamp(12px, 3vw, 14px)" }}>
          {openTasks > 0 ? `You have ${openTasks} pending items today.` : "All caught up! Excellent work."}
        </p>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} md={8}>
          <StatCard title="Assigned Tasks" value={totalAssigned} icon={<ProjectOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <StatCard title="Active Items" value={openTasks} icon={<ClockCircleOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <StatCard title="Completed" value={doneTasks} icon={<CheckCircleOutlined />} />
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        <Col xs={24} md={7}>
          <div className="glass-card" style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: "0 0 20px", color: "var(--foreground)", fontSize: "15px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Active Projects
              <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "10px", color: "var(--muted-foreground)" }}>{activeProjects.length}</span>
            </h3>
            {activeProjects.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px" }}>
                <p style={{ color: "var(--muted-foreground)", fontSize: "13px", margin: 0 }}>No active projects.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeProjects.map((project) => (
                  <div 
                    key={project.id} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12, 
                      color: "var(--foreground)", 
                      fontSize: "13px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid transparent",
                      transition: "all 0.2s ease"
                    }}
                    className="project-item-hover"
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px var(--primary)" }} />
                    <span style={{ fontWeight: 500 }}>{project.project_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
        
        <Col xs={24} md={17}>
          <div className="glass-card">
            <div style={{ padding: "clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0, color: "var(--foreground)", fontSize: "clamp(13px, 3.5vw, 15px)", fontWeight: 500 }}>Active Tasks</h3>
            </div>
            <Table
              dataSource={tasks.slice(0, 15)}
              rowKey="id"
              size="middle"
              pagination={{
                pageSize: 15,
                total: tasks.length,
                showSizeChanger: false,
                showQuickJumper: false,
                simple: true,
                size: "small"
              }}
              columns={[
                { title: "Task", dataIndex: "task_name", key: "task_name", width: 150, render: (x) => <span style={{ fontWeight: 500, color: "var(--foreground)", fontSize: "clamp(12px, 3vw, 14px)" }}>{x}</span> },
                { title: "Project", dataIndex: ["project", "project_name"], key: "project", width: 120, render: (x) => <span className="text-muted" style={{ fontSize: "clamp(11px, 2.8vw, 13px)" }}>{x}</span> },
                { title: "Status", dataIndex: "task_status", key: "task_status", width: 100, render: (s) => (
                  <span style={{ fontSize: "clamp(10px, 2.5vw, 12px)", color: STATUS_COLORS[s] || "var(--muted-foreground)", fontWeight: 500 }}>
                    {STATUS_LABELS[s] || s}
                  </span>
                )},
                {
                  title: "",
                  key: "actions",
                  align: "right",
                  render: (_: unknown, row: AssignedTask) => {
                    const currentStatus = row.original_status || row.task_status;
                    const options = [];
                    
                    // Show current status as disabled if it's not the target
                    options.push({ 
                      value: row.task_status, 
                      label: STATUS_LABELS[row.task_status] || row.task_status,
                      disabled: true 
                    });

                    if (currentStatus === "To_Do") {
                      options.push({ value: "On_Progress", label: STATUS_LABELS.On_Progress });
                    } else if (currentStatus === "On_Progress") {
                      options.push({ value: "Done", label: STATUS_LABELS.Done });
                    }

                    return (
                      <Space wrap size="small">
                        <Select
                          size="small"
                          style={{ width: "clamp(90px, 20vw, 110px)", fontSize: "clamp(11px, 2.8vw, 12px)" }}
                          value={row.task_status}
                          variant="borderless"
                          onChange={async (value: string) => {
                            try {
                              await api.patch(`/tasks/${row.id}/status`, { status: value });
                              // After update, it might not be overdue anymore if we moved to Done
                              // But for simplicity we just update the local state with what we sent
                              setTasks(tasks.map((item) => (item.id === row.id ? { ...item, task_status: value, original_status: value } : item)));
                              message.success("Status updated");
                            } catch (e: any) {
                              message.error(e.response?.data?.message || "Update failed");
                            }
                          }}
                          options={options}
                        />
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedTask(row);
                            setUploadModalOpen(true);
                          }}
                          style={{ fontSize: "clamp(11px, 2.8vw, 12px)" }}
                        >Upload</Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedTaskDetails(row);
                          }}
                          style={{ fontSize: "clamp(11px, 2.8vw, 12px)" }}
                        >Files</Button>
                      </Space>
                    );
                  },
                },
              ]}
            />
          </div>
        </Col>
      </Row>

      <Modal
        title={`Work Submissions: ${selectedTaskDetails?.task_name}`}
        open={selectedTaskDetails !== null}
        onCancel={() => setSelectedTaskDetails(null)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedTaskDetails && (
          <TaskFilePreview
            files={selectedTaskDetails.task_files || []}
            taskId={selectedTaskDetails.id}
            isAdmin={false}
          />
        )}
      </Modal>

      <Modal
        title="Submit Work"
        open={uploadModalOpen}
        onCancel={() => {
          setUploadModalOpen(false);
          setFileList([]);
          form.resetFields();
        }}
        footer={null}
        centered
        width={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.9, 500) : 500}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload} style={{ marginTop: 20 }}>
          <Form.Item label="File" required>
            <Upload.Dragger
              beforeUpload={() => false}
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Support for a single upload. Max 10MB.</p>
            </Upload.Dragger>
          </Form.Item>
          
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Describe your work..." rows={4} />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "clamp(8px, 3vw, 12px)", marginTop: "clamp(16px, 5vw, 24px)", flexWrap: "wrap" }}>
            <Button onClick={() => setUploadModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={uploading}>
              Submit Work
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}



