import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";
import { AuthTokens } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== Request Interceptor: Attach Bearer token =====
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response Interceptor: Handle 401 / Refresh =====
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>)[
              "Authorization"
            ] = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<{ data: AuthTokens }>(
          `${API_URL}/api/auth/refresh`,
          { refreshToken }
        );
        const tokens = response.data.data;
        setTokens(tokens);
        processQueue(null, tokens.accessToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)[
            "Authorization"
          ] = `Bearer ${tokens.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ===== Typed API Methods =====
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<{ data: T }>(url, config).then((r) => r.data.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<{ data: T }>(url, data, config).then((r) => r.data.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.put<{ data: T }>(url, data, config).then((r) => r.data.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<{ data: T }>(url, data, config).then((r) => r.data.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<{ data: T }>(url, config).then((r) => r.data.data),
};

export default api;
