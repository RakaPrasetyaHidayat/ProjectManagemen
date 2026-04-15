"use client";

import { useEffect, useState } from "react";
import { Table, Card } from "antd";
import api from "@/lib/api";
import PageHeader from "@/components/molecules/PageHeader";

interface ActivityLog {
  id: number;
  actor: string;
  action: string;
  target: string;
  when: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get("/logs?limit=100");
        setLogs(data.data?.logs || []);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns = [
    { title: "Timestamp", dataIndex: "when", key: "when" },
    { title: "Actor", dataIndex: "actor", key: "actor" },
    { title: "Action", dataIndex: "action", key: "action" },
    { title: "Target", dataIndex: "target", key: "target" },
  ];

  return (
    <div className="animate-in">
      <PageHeader title="Activity Logs" subtitle="Track all actions performed in the workspace" />
      <Card style={{ marginTop: 24 }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </div>
  );
}
