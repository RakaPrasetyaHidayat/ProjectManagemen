interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    Approved: "#10b981",
    Pending: "#f59e0b",
    Rejected: "#ef4444",
  };

  const color = statusColors[status] || "var(--muted-foreground)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--foreground)" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {status}
    </div>
  );
}
