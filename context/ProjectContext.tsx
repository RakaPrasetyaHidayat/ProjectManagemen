"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "./AuthContext";

interface Project {
  id: number;
  project_name: string;
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const refreshProjects = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await api.get("/projects?limit=100");
      setProjects(data.data?.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      refreshProjects();
    }
  }, [isAuthenticated, authLoading, refreshProjects]);

  return <ProjectContext.Provider value={{ projects, loading, refreshProjects }}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectProvider");
  return ctx;
}
