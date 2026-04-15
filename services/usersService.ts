import api, { safeApiCall, type ApiResponse } from "./apiClient";

export interface User {
  id: number;
  username: string;
  role: "manager" | "staf";
  status: string;
  created_at?: string;
}

export const usersService = {
  getProfile: () =>
    safeApiCall(() => api.get<ApiResponse<User>>("/users/profile")),

  getDashboardStats: () =>
    safeApiCall(() => api.get<ApiResponse<any>>("/users/dashboard/stats")),

  getAllUsers: (page = 1, limit = 10) =>
    safeApiCall(() => api.get<ApiResponse<User[]>>("/users", { params: { page, limit } })),

  getUserById: (id: number) =>
    safeApiCall(() => api.get<ApiResponse<User>>(`/users/${id}`)),

  createUser: (payload: any) =>
    safeApiCall(() => api.post<ApiResponse<User>>("/users", payload)),

  updateUser: (id: number, payload: any) =>
    safeApiCall(() => api.put<ApiResponse<User>>(`/users/${id}`, payload)),

  deleteUser: (id: number) =>
    safeApiCall(() => api.delete<ApiResponse<void>>(`/users/${id}`)),
};

export default usersService;
