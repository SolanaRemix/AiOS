import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthTokens, LoginCredentials, RegisterData } from "@/types";
import { apiClient } from "@/lib/api";
import { setTokens, clearTokens } from "@/lib/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiClient.post<{
            user: User;
            tokens: AuthTokens;
          }>("/auth/login", credentials);
          setTokens(result.tokens);
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Login failed";
          const axiosErr = err as { response?: { data?: { message?: string } } };
          set({
            error: axiosErr?.response?.data?.message || message,
            isLoading: false,
          });
          throw err;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiClient.post<{
            user: User;
            tokens: AuthTokens;
          }>("/auth/register", data);
          setTokens(result.tokens);
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Registration failed";
          const axiosErr = err as { response?: { data?: { message?: string } } };
          set({
            error: axiosErr?.response?.data?.message || message,
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await apiClient.post("/auth/logout");
        } catch {
          // ignore error
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false, error: null });
        }
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const user = await apiClient.get<User>("/auth/me");
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User) => set({ user }),
    }),
    {
      name: "aios-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
