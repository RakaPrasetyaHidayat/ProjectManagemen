"use client";

import { useEffect, useState } from "react";
import { Modal, message, Button, Empty, Spin, Card, Space, Popconfirm, Input } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import notesService, { type Note } from "@/services/notesService";
import PageHeader from "@/components/molecules/PageHeader";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await notesService.getNotes(1, 100);
        setNotes(data.notes || []);
      } catch {
        message.error("Failed to fetch notes");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSaveNote = async () => {
    if (!content.trim()) {
      message.error("Content cannot be empty");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await notesService.updateNote(editingId, content);
        message.success("Note updated");
      } else {
        await notesService.createNote(content);
        message.success("Note created");
      }
      setShowModal(false);
      setEditingId(null);
      setContent("");
      const data = await notesService.getNotes(1, 100);
      setNotes(data.notes || []);
    } catch {
      message.error(editingId ? "Update failed" : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notesService.deleteNote(id);
      message.success("Note deleted");
      setNotes(notes.filter(n => n.id !== id));
    } catch {
      message.error("Delete failed");
    }
  };

  const openNewNote = () => {
    setEditingId(null);
    setContent("");
    setShowModal(true);
  };

  return (
    <div className="animate-in">
      <PageHeader 
        title="Personal Notes" 
        subtitle="Keep track of your thoughts and project details privately."
        buttonText="New Note"
        onButtonClick={openNewNote}
      />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
          <Spin size="large" />
        </div>
      ) : notes.length === 0 ? (
        <Empty description="No notes yet" style={{ marginTop: 100 }} />
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "24px",
          marginTop: "24px"
        }}>
          {notes.map((note) => (
            <div 
              key={note.id} 
              className="glass-card" 
              style={{ 
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" }}>
                  {new Date(note.updated_at || note.created_at || "").toLocaleDateString()}
                </span>
                <Space size={4}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined style={{ fontSize: 13 }} />}
                    onClick={() => {
                      setEditingId(note.id);
                      setContent(note.content);
                      setShowModal(true);
                    }}
                  />
                  <Popconfirm
                    title="Delete note?"
                    onConfirm={() => handleDelete(note.id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined style={{ fontSize: 13 }} />} />
                  </Popconfirm>
                </Space>
              </div>

              <div style={{ 
                color: "var(--foreground)", 
                fontSize: "14px", 
                lineHeight: "1.6", 
                whiteSpace: "pre-wrap",
                flex: 1,
                marginBottom: "12px",
                display: "-webkit-box",
                WebkitLineClamp: 6,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>
                {note.content}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingId ? "Edit Note" : "New Note"}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSaveNote}
        okText={editingId ? "Update" : "Create"}
        confirmLoading={saving}
        width={500}
        centered
        destroyOnClose
      >
        <Input.TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your note here..."
          rows={8}
          autoFocus
          style={{ 
            background: "rgba(255,255,255,0.02)", 
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)"
          }}
        />
      </Modal>
    </div>
  );
}
