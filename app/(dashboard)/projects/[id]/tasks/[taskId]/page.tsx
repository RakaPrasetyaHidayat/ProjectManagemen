"use client";

import { useState, useEffect } from "react";
import { Button, Card, Form, Input, Tag, Spin, message, Upload, Skeleton, Modal } from "antd";
import { ArrowLeftOutlined, UploadOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import dayjs from "dayjs";
import api from "@/lib/api";
import tasksService from "@/services/tasksService";
import TaskFilePreview from "@/components/TaskFilePreview";
import { useAuth } from "@/context/AuthContext";

interface TaskFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  description?: string;
  uploaded_at: string;
  uploader?: { username: string };
}

interface TaskData {
  id: number;
  task_name: string;
  task_status: string;
  original_status?: string;
  deadline?: string;
  users?: { id: number; username: string };
  project?: { id: number; project_name: string };
  task_files?: TaskFile[];
}

const STATUS_COLORS: Record<string, string> = {
  To_Do: "purple",
  On_Progress: "gold",
  Done: "green",
  Overdue: "red",
};

const STATUS_LABELS: Record<string, string> = {
  To_Do: "To Do",
  On_Progress: "Doing",
  Done: "Done",
  Overdue: "Overdue",
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.id as string;
  const taskId = parseInt(params.taskId as string);

  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileForm] = Form.useForm();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isManager = user?.role === "manager";
  const isAssigned = task?.users?.id === user?.id;

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tasks/${taskId}`);
      setTask(data.data);
    } catch (err) {
      message.error("Gagal memuat detail task");
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (values: { description?: string }) => {
    const fileList = fileForm.getFieldValue("file");
    if (!fileList || fileList.length === 0) {
      message.error("Pilih file terlebih dahulu");
      return;
    }

    const file = fileList[0].originFileObj;
    setUploading(true);

    try {
      await tasksService.uploadTaskFile(taskId, file, values.description);
      message.success("File berhasil diunggah");
      fileForm.resetFields();
      setShowUploadModal(false);
      fetchTask();
    } catch (err) {
      message.error("Gagal mengunggah file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await tasksService.deleteTaskFile(taskId, fileId);
      message.success("File dihapus");
      fetchTask();
    } catch (err) {
      message.error("Gagal menghapus file");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Task tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 24 }}
      >
        Kembali
      </Button>

      <Card
        style={{ marginBottom: 24 }}
        title={
          <div>
            <h2 style={{ margin: "0 0 8px 0" }}>{task.task_name}</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Tag color={STATUS_COLORS[task.task_status] || "default"}>
                {STATUS_LABELS[task.task_status] || task.task_status}
              </Tag>
              {task.deadline && (
                <span style={{ fontSize: 12, color: "#666" }}>
                  Deadline: {dayjs(task.deadline).format("DD MMM YYYY")}
                </span>
              )}
            </div>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          <div>
            <p style={{ color: "#666", marginBottom: 4 }}>Proyek</p>
            <p style={{ fontWeight: 500 }}>{task.project?.project_name || "-"}</p>
          </div>
          <div>
            <p style={{ color: "#666", marginBottom: 4 }}>Ditugaskan ke</p>
            <p style={{ fontWeight: 500 }}>{task.users?.username || "-"}</p>
          </div>
        </div>
      </Card>

      <Card title="File Pengajuan" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          {(isManager || isAssigned) && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setShowUploadModal(true)}
              style={{ marginBottom: 16 }}
            >
              Upload File
            </Button>
          )}
        </div>

        <TaskFilePreview
          files={task.task_files || []}
          taskId={taskId}
          isAdmin={isManager}
          onDelete={handleDeleteFile}
        />
      </Card>

      <Modal
        title="Upload File"
        open={showUploadModal}
        onCancel={() => {
          setShowUploadModal(false);
          fileForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={fileForm}
          layout="vertical"
          onFinish={handleUploadFile}
        >
          <Form.Item
            name="file"
            label="Pilih File"
            valuePropName="fileList"
            getValueFromEvent={(e) => e?.fileList}
            rules={[{ required: true, message: "File harus dipilih" }]}
          >
            <Upload maxCount={1} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Pilih File</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="description"
            label="Deskripsi (opsional)"
            rules={[{ max: 5000, message: "Deskripsi terlalu panjang" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Deskripsi file pengajuan..."
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <div style={{ textAlign: "right", gap: 8, display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setShowUploadModal(false);
                fileForm.resetFields();
              }}
            >
              Batal
            </Button>
            <Button type="primary" htmlType="submit" loading={uploading}>
              Unggah
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
