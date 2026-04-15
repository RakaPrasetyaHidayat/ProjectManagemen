"use client";

import React, { useState } from "react";
import { Modal, Button, Spin, message, Empty, Typography, Space } from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileOutlined,
} from "@ant-design/icons";
import api from "@/services/apiClient";
import * as XLSX from "xlsx";

const { Text } = Typography;

interface TaskFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  description?: string;
  uploaded_at: string;
  uploader?: { username: string };
}

interface TaskFilePreviewProps {
  files: TaskFile[];
  taskId: number;
  isAdmin: boolean;
  onDelete?: (fileId: number) => Promise<void>;
}

const getMimeType = (ext: string) => {
  const mimes: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
  };
  return mimes[ext.toLowerCase()] || "application/octet-stream";
};

const getFileIcon = (type: string) => {
  if (!type) return <FileOutlined />;
  const t = type.toLowerCase();
  if (["png", "jpg", "jpeg", "svg"].includes(t)) return <FileImageOutlined style={{ color: "#1890ff" }} />;
  if (t === "pdf") return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
  if (["xlsx", "xls"].includes(t)) return <FileExcelOutlined style={{ color: "#52c41a" }} />;
  if (["docx", "doc"].includes(t)) return <FileWordOutlined style={{ color: "#2b579a" }} />;
  return <FileOutlined />;
};

const TaskFilePreview: React.FC<TaskFilePreviewProps> = ({
  files,
  taskId,
  isAdmin,
  onDelete,
}) => {
  const [previewFile, setPreviewFile] = useState<TaskFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<any[][] | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const handleDownload = async (file: TaskFile) => {
    try {
      const response = await api.get(
        `/tasks/${taskId}/files/${file.id}/download`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error("Failed to download file");
    }
  };

  const handlePreview = async (file: TaskFile) => {
    setLoading(true);
    setPreviewFile(file);
    setPreviewUrl(null);
    setExcelData(null);
    setDocxHtml(null);

    try {
      const fileType = file.file_type?.toLowerCase() || "";
      const response = await api.get(
        `/tasks/${taskId}/files/${file.id}/download`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { 
        type: response.headers["content-type"] || getMimeType(fileType) 
      });
      const url = URL.createObjectURL(blob);

      if (["png", "jpg", "jpeg", "svg"].includes(fileType)) {
        setPreviewUrl(url);
      } else if (fileType === "pdf") {
        setPreviewUrl(url);
      } else if (["txt", "log", "json", "csv"].includes(fileType)) {
        const text = await blob.text();
        setDocxHtml(`<pre style="white-space: pre-wrap; word-break: break-all;">${text}</pre>`);
      } else if (["xlsx", "xls"].includes(fileType)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          setExcelData(json);
        };
        reader.readAsArrayBuffer(blob);
      } else if (["docx", "doc"].includes(fileType)) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.default.convertToHtml({ arrayBuffer });
        setDocxHtml(result.value);
      } else {
        message.info("Preview not available for this file type. Please download.");
        setPreviewFile(null);
      }
    } catch (error) {
      console.error("Preview error:", error);
      message.error("Failed to load file preview");
      setPreviewFile(null);
    } finally {
      setLoading(false);
    }
  };

  const renderPreviewContent = () => {
    if (loading) return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text type="secondary">Preparing preview...</Text>
        </Space>
      </div>
    );

    const type = previewFile?.file_type?.toLowerCase();

    if (previewUrl && ["png", "jpg", "jpeg", "svg"].includes(type || "")) {
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
        </div>
      );
    }

    if (previewUrl && type === "pdf") {
      return (
        <iframe src={previewUrl} style={{ width: "100%", height: "70vh", border: "none", borderRadius: "8px" }} title="PDF Preview" />
      );
    }

    if (excelData) {
      return (
        <div style={{ overflow: "auto", maxHeight: "70vh", border: "1px solid #f0f0f0", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
            <thead>
              {excelData.length > 0 && (
                <tr style={{ background: "#fafafa" }}>
                  {excelData[0].map((cell: any, j: number) => (
                    <th key={j} style={{ border: "1px solid #f0f0f0", padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600 }}>{cell}</th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {excelData.slice(1, 100).map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {row.map((cell: any, j: number) => (
                    <td key={j} style={{ border: "1px solid #f0f0f0", padding: "10px", fontSize: "13px" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {excelData.length > 100 && (
            <div style={{ padding: "12px", textAlign: "center", color: "#8c8c8c", fontSize: "12px", background: "#fafafa" }}>
              Showing first 100 rows
            </div>
          )}
        </div>
      );
    }

    if (docxHtml) {
      return (
        <div 
          style={{ padding: "40px", overflow: "auto", maxHeight: "70vh", background: "white", border: "1px solid #f0f0f0", borderRadius: "8px", lineHeight: 1.6 }}
          className="docx-preview"
          dangerouslySetInnerHTML={{ __html: docxHtml }} 
        />
      );
    }

    return <Empty description="Preview not available for this file type" />;
  };


  if (!files || files.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No files attached" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {files.map((file) => (
        <div 
          key={file.id} 
          className="glass-card"
          style={{ 
            padding: "12px 16px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", overflow: "hidden" }}>
            <div style={{ fontSize: "24px", display: "flex", alignItems: "center" }}>
              {getFileIcon(file.file_type)}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div 
                style={{ 
                  fontWeight: 500, 
                  color: "var(--foreground)", 
                  whiteSpace: "nowrap", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis",
                  maxWidth: "300px" 
                }} 
                title={file.file_name}
              >
                {file.file_name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" }}>
                {file.uploader?.username} • {new Date(file.uploaded_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <Space size={8}>
            <Button 
              type="text"
              size="small"
              icon={<EyeOutlined />} 
              onClick={() => handlePreview(file)}
              style={{ color: "var(--primary)" }}
            >
              Preview
            </Button>
            <Button 
              type="text"
              size="small"
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(file)}
            />
            {isAdmin && (
              <Button 
                type="text"
                size="small"
                danger
                loading={deleteLoading === file.id}
                icon={<DeleteOutlined />} 
                onClick={() => {
                  Modal.confirm({
                    title: "Hapus File",
                    content: "Apakah Anda yakin ingin menghapus file ini?",
                    okText: "Hapus",
                    okType: "danger",
                    cancelText: "Batal",
                    centered: true,
                    onOk: async () => {
                      setDeleteLoading(file.id);
                      await onDelete?.(file.id);
                      setDeleteLoading(null);
                    },
                  });
                }}
              />
            )}
          </Space>
        </div>
      ))}

      <Modal
        title={
          <Space>
            {previewFile && getFileIcon(previewFile.file_type)}
            <span style={{ fontWeight: 600 }}>{previewFile?.file_name}</span>
          </Space>
        }
        open={!!previewFile}
        onCancel={() => {
          setPreviewFile(null);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        }}
        width={1000}
        footer={[
          <Button key="dl" type="primary" icon={<DownloadOutlined />} onClick={() => previewFile && handleDownload(previewFile)}>
            Download
          </Button>,
          <Button key="close" onClick={() => setPreviewFile(null)}>
            Close
          </Button>
        ]}
        centered
        destroyOnClose
      >
        {renderPreviewContent()}
      </Modal>
    </div>
  );
};

export default TaskFilePreview;
