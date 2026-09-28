import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import type { UserInfoDto } from '../types';

describe('useAuthStore', () => {
  const mockUser: UserInfoDto = {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    role: 'User',
    avatarUrl: null,
  };

  // Memory-backed localStorage mock for test environment
  let storage: Record<string, string> = {};

  beforeAll(() => {
    const localStorageMock = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    storage = {};
    useAuthStore.getState().clearAuth();
  });

  it('starts with cleared/empty state when localStorage is empty', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets auth and persists to storage upon setAuth', () => {
    const token = 'fake-jwt-token-12345';
    useAuthStore.getState().setAuth(token, mockUser);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe(token);
    expect(state.token).toBe(token);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);

    const stored = JSON.parse(storage['mysocialapp_auth'] || '{}');
    expect(stored.token).toBe(token);
    expect(stored.user.username).toBe('testuser');
  });

  it('clears auth and removes from storage upon clearAuth', () => {
    useAuthStore.getState().setAuth('token-to-delete', mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(storage['mysocialapp_auth']).toBeUndefined();
  });

  it('updates partial user info without modifying token', () => {
    useAuthStore.getState().setAuth('keep-this-token', mockUser);

    useAuthStore.getState().updateUser({
      displayName: 'Updated Display Name',
      bio: 'New bio content',
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('keep-this-token');
    expect(state.user?.displayName).toBe('Updated Display Name');
    expect(state.user?.bio).toBe('New bio content');
    expect(state.user?.username).toBe('testuser'); // Preserved original
  });
});
