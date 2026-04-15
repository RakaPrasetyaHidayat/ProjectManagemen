import axios from "axios";
import type { AxiosError, AxiosResponse } from "axios";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiError {
  message: string;
  status: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://taskflow-backend-black.vercel.app";
const API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response & errors
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const handleApiError = (error: AxiosError<ApiResponse>): ApiError => ({
  message: error.response?.data?.message || error.message || "Error",
  status: error.response?.status || 500,
});

export const safeApiCall = async <T,>(
  fn: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  const response = await fn();
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data as T;
};

export default api;
