import api, { safeApiCall, type ApiResponse } from "./apiClient";

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  projectId: number;
  assignedTo?: number;
  created_at?: string;
}

export const tasksService = {
  getAllTasks: (page = 1, limit = 10, status?: string, projectId?: number) => {
    const params: any = { page, limit };
    if (status) params.status = status;
    if (projectId) params.projectId = projectId;
    return safeApiCall(() => api.get<ApiResponse<Task[]>>("/tasks", { params }));
  },

  getTaskById: (id: number) =>
    safeApiCall(() => api.get<ApiResponse<Task>>(`/tasks/${id}`)),

  createTask: (payload: any) =>
    safeApiCall(() => api.post<ApiResponse<Task>>("/tasks", payload)),

  updateTask: (id: number, payload: any) =>
    safeApiCall(() => api.put<ApiResponse<Task>>(`/tasks/${id}`, payload)),

  updateTaskStatus: (id: number, status: string) =>
    safeApiCall(() => api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status })),

  deleteTask: (id: number) =>
    safeApiCall(() => api.delete<ApiResponse<void>>(`/tasks/${id}`)),

  uploadTaskFile: (id: number, file: File, description?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (description) {
      formData.append("description", description);
    }
    return safeApiCall(() =>
      api.post<ApiResponse<any>>(`/tasks/${id}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  deleteTaskFile: (taskId: number, fileId: number) =>
    safeApiCall(() => api.delete<ApiResponse<void>>(`/tasks/${taskId}/files/${fileId}`)),
};

export default tasksService;
