"use client";

import { Card } from "antd";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color?: string;
  className?: string;
}

export default function StatCard({ title, value, icon, className = "" }: StatCardProps) {
  return (
    <div 
      className={`glass-card animate-in ${className}`} 
      style={{ 
        padding: "clamp(16px, 4vw, 20px) clamp(16px, 5vw, 24px)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px -10px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "clamp(8px, 3vw, 12px)" }}>
        <span style={{ color: "var(--muted-foreground)", fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 500, letterSpacing: "-0.01em" }}>
          {title}
        </span>
        <div style={{ color: "var(--primary)", fontSize: "clamp(14px, 3.5vw, 16px)", opacity: 0.8 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}
