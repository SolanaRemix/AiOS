"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { LoginCredentials, RegisterData } from "@/types";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    fetchMe,
    clearError,
  } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await storeLogin(credentials);
      router.push("/dashboard");
    },
    [storeLogin, router]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      await storeRegister(data);
      router.push("/dashboard");
    },
    [storeRegister, router]
  );

  const logout = useCallback(async () => {
    await storeLogout();
    router.push("/login");
  }, [storeLogout, router]);

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return false;
    }
    return true;
  }, [isAuthenticated, router]);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchMe,
    clearError,
    requireAuth,
    isAdmin,
    isSuperAdmin,
  };
}
