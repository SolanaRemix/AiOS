import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/src/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const { data } = await authApi.me();
        set({ token, user: data.user ?? data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      set({ token: null, user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    const { accessToken, refreshToken, user } = data;
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    set({ token: accessToken, user });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout errors are intentionally ignored so local token cleanup
      // always completes even when the server request fails (e.g. offline).
    }
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ token: null, user: null });
  },
}));
