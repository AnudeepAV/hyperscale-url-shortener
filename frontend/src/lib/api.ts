import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, null, {
            params: { refresh_token: refreshToken },
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface URLItem {
  id: number;
  short_code: string;
  short_url: string;
  original_url: string;
  title: string | null;
  click_count: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface AnalyticsData {
  total_clicks: number;
  unique_visitors: number;
  top_countries: { country: string; count: number }[];
  top_devices: { device: string; count: number }[];
  top_browsers: { browser: string; count: number }[];
  clicks_over_time: { date: string; count: number }[];
}

export const urlApi = {
  shorten: (data: { original_url: string; title?: string; custom_code?: string }) =>
    api.post<URLItem>("/api/v1/urls", data).then((r) => r.data),
  list: () => api.get<URLItem[]>("/api/v1/urls").then((r) => r.data),
  delete: (id: number) => api.delete(`/api/v1/urls/${id}`),
  analytics: (code: string) =>
    api.get<AnalyticsData>(`/api/v1/urls/${code}/analytics`).then((r) => r.data),
};

export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post("/api/v1/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/v1/auth/login", data).then((r) => r.data),
};
