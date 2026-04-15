"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, Button, Table, Modal, Form, Input, DatePicker, Select, message, Skeleton, Alert, Tag, Tooltip, Upload } from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import api from "@/lib/api";
import tasksService from "@/services/tasksService";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { useUsers } from "@/context/UsersContext";

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

interface TaskEntry {
  id: number;
  task_name: string;
  task_status: string;
  original_status?: string;
  users?: { username?: string; id?: number };
  deadline?: string;
  task_files?: TaskFile[];
}

interface ProjectDetailData {
  id: number;
  project_name: string;
  users?: { username?: string };
  tasks?: TaskEntry[];
}

const STATUS_COLORS: Record<string, string> = { To_Do: "purple", On_Progress: "gold", Done: "green", Overdue: "red" };
const STATUS_LABELS: Record<string, string> = { To_Do: "To Do", On_Progress: "Doing", Done: "Done", Overdue: "Overdue" };

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { users } = useUsers();
  const projectId = Number(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [fileUploadForm] = Form.useForm();
  const [previewTask, setPreviewTask] = useState<TaskEntry | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFileModalOpen, setUploadFileModalOpen] = useState(false);
  const isManager = user?.role === "manager";

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setProject(data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load project";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const openNewTask = () => { setEditingTask(null); form.resetFields(); setModalOpen(true); };
  
  const openEditTask = (task: TaskEntry) => {
    if (!isManager && task.users?.id !== user?.id) {
      message.error("You can only edit tasks assigned to you");
      return;
    }
    setEditingTask(task);
    form.setFieldsValue({
      task_name: task.task_name,
      task_status: task.original_status || task.task_status,
      task_assign: task.users?.id,
      deadline: task.deadline ? dayjs(task.deadline) : null
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingTask(null); form.resetFields(); };

  const getStatusOptions = (currentStatus?: string) => {
    const allStatuses = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
    
    if (isManager) {
      return allStatuses.filter(s => s.value !== "Overdue");
    }
    
    // Staff can only change To_Do → On_Progress
    if (currentStatus === "To_Do") {
      return [{ value: "On_Progress", label: "Doing" }];
    }
    if (currentStatus === "On_Progress") {
      return [{ value: "Done", label: "Done" }];
    }
    
    return [];
  };

  const canEditTask = (task: TaskEntry) => {
    if (isManager) return true;
    return task.users?.id === user?.id;
  };

  const saveTask = async (values: { task_name: string; task_assign?: number; task_status?: string; deadline?: { toISOString: () => string } | null }) => {
    setSaving(true);
    try {
      if (editingTask) {
        if (isManager) {
          const payload: any = { task_project: projectId, task_name: values.task_name };
          payload.task_assign = values.task_assign;
          payload.task_status = values.task_status;
          payload.deadline = values.deadline ? values.deadline.toISOString() : null;
          await api.put(`/tasks/${editingTask.id}`, payload);
        } else {
          await api.patch(`/tasks/${editingTask.id}/status`, { status: values.task_status });
        }
        message.success("Task updated");
      } else {
        if (!isManager) {
          message.error("Only managers can create tasks");
          setSaving(false);
          return;
        }
        const payload: any = { task_project: projectId, task_name: values.task_name };
        payload.task_assign = values.task_assign;
        payload.deadline = values.deadline ? values.deadline.toISOString() : null;
        await api.post("/tasks", payload);
        message.success("Task created");
      }
      closeModal();
      fetchProject();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save task";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id: number) => {
    if (!isManager) {
      message.error("Only managers can delete tasks");
      return;
    }
    try {
      await api.delete(`/tasks/${id}`);
      message.success("Task deleted");
      fetchProject();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete task";
      message.error(msg);
    }
  };

  const handleUploadFile = async (values: { description?: string }, file: File | undefined) => {
    if (!file || !editingTask) {
      message.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      await tasksService.uploadTaskFile(editingTask?.id || 0, file, values.description);
      message.success("File uploaded successfully");
      fileUploadForm.resetFields();
      setUploadFileModalOpen(false);
      fetchProject();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload file";
      message.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenUploadModal = (task: TaskEntry) => {
    if (!isManager && task.users?.id !== user?.id) {
      message.error("You can only upload files for tasks assigned to you");
      return;
    }
    setEditingTask(task); // We use editingTask as the reference for upload too, or a new state
    fileUploadForm.resetFields();
    // Automatically open file picker
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0 && (editingTask || previewTask)) {
      // Set file to form and open modal
      const file = files[0];
      fileUploadForm.setFieldValue("file", [{ originFileObj: file }]);
      setUploadFileModalOpen(true);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await api.delete(`/tasks/${previewTask?.id}/files/${fileId}`);
      message.success("File deleted");
      fetchProject();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete file";
      message.error(msg);
    }
  };

  const columns = [
    { title: "Name", dataIndex: "task_name", key: "task_name" },
    { title: "Status", dataIndex: "task_status", key: "task_status", render: (s: string) => <Tag color={STATUS_COLORS[s] ?? "default"}>{STATUS_LABELS[s] ?? s}</Tag> },
    { title: "Assigned", dataIndex: ["users", "username"], key: "users", render: (v: string) => v || "—" },
    { title: "Deadline", dataIndex: "deadline", key: "deadline", render: (d: string) => (d ? dayjs(d).format("DD MMM YYYY") : "—") },
    {
      title: "Files",
      key: "files",
      render: (_: any, rec: TaskEntry) => {
        const hasFiles = rec.task_files && rec.task_files.length > 0;
        return (
          <Button
            size="small"
            onClick={() => setPreviewTask(rec)}
            type={hasFiles ? "primary" : "default"}
            icon={<EyeOutlined />}
          >
            {hasFiles ? `View Files (${rec.task_files?.length})` : "View Details"}
          </Button>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, rec: TaskEntry) => {
        const canEdit = canEditTask(rec);
        const isAssigned = rec.users?.id === user?.id;
        return (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {canEdit && <Button size="small" onClick={() => openEditTask(rec)}>Edit</Button>}
            {isAssigned && <Button size="small" icon={<UploadOutlined />} onClick={() => handleOpenUploadModal(rec)}>Upload</Button>}
            {!isManager && !rec.users && (
              <Button 
                size="small" 
                type="primary" 
                onClick={async () => {
                  try {
                    await api.patch(`/tasks/${rec.id}/status`, { status: "On_Progress" });
                    message.success("Task taken! You are now assigned.");
                    fetchProject();
                  } catch (err) {
                    message.error("Failed to take task");
                  }
                }}
              >
                Take Task
              </Button>
            )}
            {isManager && <Button size="small" danger onClick={() => deleteTask(rec.id)}>Delete</Button>}
          </div>
        );
      }
    },
  ];

  if (loading) return (
    <div style={{ padding: 24, minHeight: '100vh', background: 'var(--background)' }}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );
  if (error) return <div style={{ padding: 20 }}><Alert type="error" message={error} style={{ borderRadius: 10 }} /></div>;
  if (!project) return null;

  return (
    <div className="animate-in" style={{ padding: 24 }}>
      <Button
        onClick={() => router.push("/projects")}
        style={{
          marginBottom: 24,
          background: "#000",
          color: "#fff",
          border: "1px solid #333",
          height: "40px",
          padding: "0 20px"
        }}
      >
        Back to Projects
      </Button>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: "var(--foreground)", fontSize: 32, fontWeight: 600, margin: 0, letterSpacing: "-0.03em" }}>
          {project.project_name}
        </h1>
        <p style={{ color: "var(--muted-foreground)", margin: "4px 0 0", fontSize: 14 }}>
          Created by {project.users?.username || "—"}
        </p>
      </div>

      {isManager && (
        <div style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            onClick={openNewTask}
            size="large"
            style={{ padding: "0 24px" }}
          >
            Add Task
          </Button>
        </div>
      )}

      <div className="glass-card">
        <Table
          dataSource={project.tasks || []}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </div>

      <Modal title={editingTask ? "Edit Task" : "New Task"} open={modalOpen} onCancel={closeModal} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={saveTask} initialValues={{ task_status: "To_Do" }}>
          {isManager && (
            <>
              <Form.Item name="task_name" label="Task Name" rules={[{ required: true, message: "Task name required" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="task_assign" label="Assign To" rules={[{ required: true, message: "Please select a user" }]}>
                <Select placeholder="Select user" options={users.map(u => ({ label: u.username, value: u.id }))} />
              </Form.Item>
              <Form.Item name="deadline" label="Deadline">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
              {editingTask && (
                <Form.Item name="task_status" label="Status">
                  <Select options={getStatusOptions()} />
                </Form.Item>
              )}
            </>
          )}
          {!isManager && editingTask && (
            <>
              <div style={{ marginBottom: 16 }}>
                <strong>{editingTask.task_name}</strong>
              </div>
              <Form.Item name="task_status" label="Status">
                <Select options={getStatusOptions(editingTask.original_status || editingTask.task_status)} />
              </Form.Item>
            </>
          )}
          <div style={{ textAlign: "right" }}>
            <Button onClick={closeModal} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>{editingTask ? "Save" : "Create"}</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`Work Submissions: ${previewTask?.task_name}`}
        open={previewTask !== null}
        onCancel={() => setPreviewTask(null)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {previewTask && (
          <TaskFilePreview
            files={previewTask.task_files || []}
            taskId={previewTask.id}
            isAdmin={isManager}
            onDelete={handleDeleteFile}
          />
        )}
      </Modal>

      <Modal
        title={`Submit Work: ${editingTask?.task_name}`}
        open={uploadFileModalOpen}
        onCancel={() => setUploadFileModalOpen(false)}
        footer={null}
        width={600}
      >
        {editingTask && (
          <Form
            form={fileUploadForm}
            layout="vertical"
            onFinish={(values) => {
              const file = (fileUploadForm.getFieldValue("file") as any)?.[0]?.originFileObj;
              handleUploadFile(values, file);
            }}
          >
            <div style={{ marginBottom: 16, padding: "12px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)" }}>Selected File:</p>
              <p style={{ margin: "4px 0 0", fontWeight: 600, color: "var(--foreground)" }}>
                {(fileUploadForm.getFieldValue("file") as any)?.[0]?.originFileObj?.name || "No file selected"}
              </p>
            </div>

            <Form.Item
              name="file"
              label="Work File"
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList}
              rules={[{ required: true, message: "Please upload a file" }]}
              style={{ display: "none" }}
            >
              <Upload maxCount={1} beforeUpload={() => false}>
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description (optional)"
              rules={[{ max: 5000, message: "Description too long" }]}
            >
              <Input.TextArea
                rows={5}
                placeholder="Add a description of your work submission..."
                showCount
                maxLength={5000}
              />
            </Form.Item>

            <div style={{ textAlign: "right" }}>
              <Button onClick={() => setUploadFileModalOpen(false)} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={uploading}>
                Submit Work
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Hidden file input for programmatic file selection */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileSelected}
        accept="*/*"
      />
    </div>
  );
}

