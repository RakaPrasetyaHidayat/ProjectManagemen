import api, { safeApiCall, type ApiResponse } from "./apiClient";

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at?: string;
}

export const projectsService = {
  getAllProjects: (page = 1, limit = 10) =>
    safeApiCall(() => api.get<ApiResponse<Project[]>>("/projects", { params: { page, limit } })),

  getProjectById: (id: number) =>
    safeApiCall(() => api.get<ApiResponse<Project>>(`/projects/${id}`)),

  createProject: (payload: any) =>
    safeApiCall(() => api.post<ApiResponse<Project>>("/projects", payload)),

  updateProject: (id: number, payload: any) =>
    safeApiCall(() => api.put<ApiResponse<Project>>(`/projects/${id}`, payload)),

  deleteProject: (id: number) =>
    safeApiCall(() => api.delete<ApiResponse<void>>(`/projects/${id}`)),
};

export default projectsService;
