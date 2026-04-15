"use client";

import { useEffect, useState } from "react";
import { Modal, message, Skeleton } from "antd";
import type { FormInstance } from "antd";
import { useForm } from "antd/es/form/Form";
import api from "@/lib/api";
import PageHeader from "@/components/molecules/PageHeader";
import ProjectsTable from "@/components/organisms/ProjectsTable";
import ProjectForm from "@/components/organisms/ProjectForm";
import { useAuth } from "@/context/AuthContext";

interface Project {
  id: number;
  project_name: string;
  created_at: string;
  users?: { username: string };
  _count?: { tasks: number };
}

export default function ProjectsTemplate() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = useForm();
  const isManager = user?.role === "manager";

  const fetchProjects = async (p = 1) => {
    setLoading(true);
    try {
      const { data: resData } = await api.get(`/projects?page=${p}&limit=10`);
      setProjects(resData.data?.projects || []);
      setTotal(resData.data?.total || 0);
      setPage(p);
    } catch (err: unknown) {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openNew = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    form.setFieldsValue({ project_name: project.project_name });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const onSubmit = async (values: { project_name: string }) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/projects/${editing.id}`, values);
        message.success("Project updated");
      } else {
        await api.post("/projects", values);
        message.success("Project launched successfully");
      }
      closeModal();
      fetchProjects(page);
    } catch {
      message.error("Failed to commit project");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await api.delete(`/projects/${id}`);
      message.success("Project purged");
      fetchProjects(page);
    } catch {
      message.error("Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px" }} className="animate-in">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ padding: "0 8px" }}>
      <PageHeader
        title="Projects"
        subtitle="Manage your organization projects and initiatives."
        buttonText={isManager ? "New Project" : undefined}
        onButtonClick={isManager ? openNew : undefined}
      />

      <ProjectsTable
        projects={projects}
        page={page}
        total={total}
        onEdit={isManager ? openEdit : undefined}
        onDelete={isManager ? onDelete : undefined}
        onPageChange={fetchProjects}
        isManager={isManager}
      />

      {isManager && (
        <Modal title={editing ? "Modify Project" : "New Project"} open={modalOpen} onCancel={closeModal} footer={null} centered width={400}>
          <ProjectForm form={form} isEditing={!!editing} onSubmit={onSubmit} loading={saving} />
        </Modal>
      )}
    </div>
  );
}
