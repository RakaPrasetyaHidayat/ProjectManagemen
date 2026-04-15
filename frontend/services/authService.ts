import api, { safeApiCall, type ApiResponse } from "./apiClient";

export interface LoginReq {
  username: string;
  password: string;
}

export interface AuthRes {
  token: string;
  user: { id: number; username: string; role: "manager" | "staf"; status: string };
}

export const authService = {
  login: (payload: LoginReq) =>
    safeApiCall(() => api.post<ApiResponse<AuthRes>>("/auth/login", payload)),

  register: (payload: LoginReq) =>
    safeApiCall<{ message?: string }>(() => api.post("/auth/register", payload)),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  },
};

export default authService;
