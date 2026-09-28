import { create } from 'zustand';
import type { UserInfoDto } from '../types';

interface AuthState {
  accessToken: string | null;
  token: string | null;
  user: UserInfoDto | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserInfoDto) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<UserInfoDto>) => void;
}

const STORAGE_KEY = 'mysocialapp_auth';

function loadInitialAuth(): { token: string | null; user: UserInfoDto | null } {
  try {
    if (typeof localStorage === 'undefined') {
      return { token: null, user: null };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    if (parsed.token && parsed.user) {
      return { token: parsed.token, user: parsed.user };
    }
  } catch (err) {
    console.error('Failed to read auth from localStorage:', err);
  }
  return { token: null, user: null };
}

const initial = loadInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initial.token,
  token: initial.token,
  user: initial.user,
  isAuthenticated: !!initial.token,

  setAuth: (token: string, user: UserInfoDto) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      }
    } catch (err) {
      console.error('Failed to persist auth:', err);
    }
    set({ accessToken: token, token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to clear auth storage:', err);
    }
    set({ accessToken: null, token: null, user: null, isAuthenticated: false });
  },

  updateUser: (partial: Partial<UserInfoDto>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...partial };
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.accessToken, user: updatedUser }));
        }
      } catch (err) {
        console.error('Failed to persist user update:', err);
      }
      return { user: updatedUser };
    });
  },
}));
