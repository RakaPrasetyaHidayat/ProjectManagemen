import api, { safeApiCall, type ApiResponse } from "./apiClient";

export interface Note {
  id: number;
  created_by: number;
  content: string;
  created_at?: string;
  updated_at?: string;
  createdByUser?: { id: number; username: string };
}

export const notesService = {
  getNotes: (page = 1, limit = 10) =>
    safeApiCall(() => api.get<ApiResponse<any>>("/notes", { params: { page, limit } })),

  getNoteById: (id: number) =>
    safeApiCall(() => api.get<ApiResponse<Note>>(`/notes/${id}`)),

  createNote: (content: string) =>
    safeApiCall(() => api.post<ApiResponse<Note>>("/notes", { content })),

  updateNote: (id: number, content: string) =>
    safeApiCall(() => api.put<ApiResponse<Note>>(`/notes/${id}`, { content })),

  deleteNote: (id: number) =>
    safeApiCall(() => api.delete<ApiResponse<void>>(`/notes/${id}`)),
};

export default notesService;
