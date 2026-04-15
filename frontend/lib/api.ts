// Re-export from canonical source to avoid duplicate API client code
export { default, handleApiError, safeApiCall } from "@/services/apiClient";
export type { ApiResponse, ApiError } from "@/services/apiClient";
