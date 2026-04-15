"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface User {
  id: number;
  username: string;
  role: string;
  status: string;
}

interface UsersContextType {
  users: User[];
  loading: boolean;
  error: string | null;
}

const UsersContext = createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get("/users?limit=999");
        setUsers(Array.isArray(data.data) ? data.data : []);
      } catch (err: any) {
        console.error("Failed to fetch users", err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError(null);
          setUsers([]);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load users");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated]);

  return <UsersContext.Provider value={{ users, loading, error }}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
