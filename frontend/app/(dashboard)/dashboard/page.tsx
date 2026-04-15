"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Skeleton, Alert } from "antd";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/templates/AdminDashboard";
import UserDashboard from "@/components/templates/UserDashboard";

interface DashboardStats {
  totalTasks: number;
  totalProjects: number;
  totalUsers: number;
  tasksByStatus: { To_Do: number; On_Progress: number; Done: number; Overdue: number };
}

interface UserSummary { id: number; role: "manager" | "staf"; username: string; }
interface TaskFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  description?: string;
  uploaded_at: string;
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
interface ActivityLog { id: number; actor: string; action: string; target: string; when: string; }

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [roleCounts, setRoleCounts] = useState<{ manager: number; staf: number }>({ manager: 0, staf: 0 });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [managerProjects, setManagerProjects] = useState<ProjectSummary[]>([]);
  const [staffTasks, setStaffTasks] = useState<AssignedTask[]>([]);
  const mounted = useRef(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [statsRes, usersRes, tasksRes, projectsRes, logsRes] = await Promise.allSettled([
        api.get("/users/dashboard/stats"),
        api.get("/users?limit=100"),
        api.get("/tasks?limit=100"),
        api.get("/projects?limit=100"),
        api.get("/logs?limit=10").catch(() => ({ data: { data: { logs: [] } } })),
      ]);

      if (!mounted.current) return;

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
      
      if (usersRes.status === "fulfilled") {
        const allUsers = usersRes.value.data.data as UserSummary[] || [];
        setRoleCounts(allUsers.reduce((a, u) => {
          if (u.role === "manager") a.manager++; else a.staf++;
          return a;
        }, { manager: 0, staf: 0 }));
      }

      if (tasksRes.status === "fulfilled") {
        const tasks = (tasksRes.value.data.data?.tasks as AssignedTask[]) || [];
        // The backend already filters tasks correctly based on the user's role and ID.
        // We trust the backend results to avoid client-side type mismatch issues.
        setStaffTasks(tasks);
      }

      if (projectsRes.status === "fulfilled" && user.role === "staf") {
        setManagerProjects(projectsRes.value.data.data?.projects as ProjectSummary[] || []);
      }

      if (logsRes.status === "fulfilled") {
        setLogs(logsRes.value.data.data?.logs || []);
      }
    } catch (err: unknown) {
      if (mounted.current) setError(err instanceof Error ? err.message : "Failed to load dashboard sync");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    mounted.current = true;
    fetchDashboardData();
    return () => { mounted.current = false; };
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div style={{ padding: '32px 40px', minHeight: '100vh', background: "#0a0a0a" }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px 40px', minHeight: '100vh', background: "#0a0a0a" }}>
        <Alert type="error" message={error} showIcon />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: "#0a0a0a" }}>
      {user.role === "manager" ? (
        <AdminDashboard 
          stats={stats} 
          logs={logs} 
          roleCounts={roleCounts} 
          refreshData={fetchDashboardData} 
        />
      ) : (
        <UserDashboard 
          tasks={staffTasks} 
          projects={managerProjects} 
          setTasks={setStaffTasks} 
        />
      )}
    </div>
  );
}
