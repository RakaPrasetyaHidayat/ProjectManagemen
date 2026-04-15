"use client";

import { useEffect, useState } from "react";
import { Modal, message, Skeleton } from "antd";
import type { FormInstance } from "antd";
import { useForm } from "antd/es/form/Form";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import PageHeader from "@/components/molecules/PageHeader";
import UsersTable from "@/components/organisms/UsersTable";
import UserForm from "@/components/organisms/UserForm";
import SearchBar from "@/components/molecules/SearchBar";

interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
}

export default function UsersTemplate() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [form] = useForm();

  useEffect(() => {
    if (currentUser && currentUser.role !== "manager") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const { data: resData } = await api.get(`/users?page=${p}&limit=10`);
      setUsers(Array.isArray(resData.data) ? resData.data : []);
      setTotal(typeof resData.pagination?.total === "number" ? resData.pagination.total : 0);
      setPage(p);
    } catch {
      setUsers([]);
      setTotal(0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    form.setFieldsValue({ username: u.username, role: u.role, status: u.status });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditUser(null);
    form.resetFields();
  };

  const onSubmit = async (values: { username: string; role: string; status: string }) => {
    setSaving(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, values);
        message.success("User updated");
      } else {
        await api.post("/users", values);
        message.success("User registered");
      }
      closeModal();
      fetchUsers(page);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Unknown error";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    if (id === currentUser?.id) {
      message.warning("Cannot delete self");
      return;
    }
    try {
      await api.delete(`/users/${id}`);
      message.success("User removed");
      fetchUsers(page);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete user";
      message.error(msg);
    }
  };

  const onChangeStatus = async (id: number, status: string) => {
    try {
      await api.put(`/users/${id}`, { status });
      message.success(`Status updated to ${status}`);
      fetchUsers(page);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to update status";
      message.error(msg);
    }
  };

  const filtered = (users || []).filter((u) => String(u.username).toLowerCase().includes(String(search).toLowerCase()));

  if (loading) {
    return (
      <div style={{ padding: "40px" }} className="animate-in">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ padding: "0 8px" }}>
      <PageHeader title="Team Members" subtitle="Manage and monitor your team member access levels." buttonText="Add Member" onButtonClick={openCreate} />

      <div style={{ marginBottom: 24 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search team members..." />
      </div>

      <UsersTable
        users={filtered}
        currentUserId={currentUser?.id}
        page={page}
        total={total}
        onEdit={openEdit}
        onDelete={onDelete}
        onChangeStatus={onChangeStatus}
        onPageChange={fetchUsers}
      />

      <Modal title={editUser ? "Edit Member" : "Add Member"} open={modalOpen} onCancel={closeModal} footer={null} centered width={400}>
        <UserForm form={form} isEditing={!!editUser} onSubmit={onSubmit} loading={saving} />
      </Modal>
    </div>
  );
}
