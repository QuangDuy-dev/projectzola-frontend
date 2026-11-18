import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../services/api/apiClient';
import { useAuthStore } from '../stores/authStore';
import type { UserInfoDto } from '../types';

const mockUser: UserInfoDto = {
  id: '11111111-1111-1111-1111-111111111111',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  role: 'User',
  avatarUrl: null,
};

function make401(config: InternalAxiosRequestConfig) {
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    status: 401,
    statusText: 'Unauthorized',
    data: { success: false, message: 'Unauthorized' },
    headers: new AxiosHeaders(),
    config,
  });
}

describe('apiClient 401 single-flight refresh queue', () => {
  let storage: Record<string, string> = {};
  const originalAdapter = apiClient.defaults.adapter;

  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
        clear: () => {
          storage = {};
        },
      },
      writable: true,
    });
  });

  beforeEach(() => {
    storage = {};
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('expired-token', mockUser);
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it('enables withCredentials on apiClient by default', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('executes a single refresh call for concurrent 401s and replays all queued requests with the new token', async () => {
    let refreshCount = 0;

    const adapter: AxiosAdapter = async (config) => {
      const url = config.url ?? '';
      if (url.includes('/api/auth/refresh')) {
        refreshCount += 1;
        // Simulate async network delay so concurrent callers queue on the same promise
        await new Promise((r) => setTimeout(r, 15));
        return {
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config,
          data: {
            success: true,
            message: 'Refreshed',
            data: {
              accessToken: 'fresh-token',
              expiration: '2026-12-01T00:00:00Z',
              user: mockUser,
            },
          },
        };
      }

      const authHeader = config.headers?.Authorization;
      if (authHeader === 'Bearer expired-token') {
        throw make401(config);
      }

      if (authHeader === 'Bearer fresh-token') {
        return {
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config,
          data: { success: true, message: 'OK', data: { path: url } },
        };
      }

      throw make401(config);
    };

    apiClient.defaults.adapter = adapter;

    const [r1, r2, r3] = await Promise.all([
      apiClient.get('/api/posts'),
      apiClient.get('/api/notifications/unread-count'),
      apiClient.get('/api/auth/me'),
    ]);

    expect(refreshCount).toBe(1);
    expect(r1.data.data.path).toBe('/api/posts');
    expect(r2.data.data.path).toBe('/api/notifications/unread-count');
    expect(r3.data.data.path).toBe('/api/auth/me');
    expect(useAuthStore.getState().accessToken).toBe('fresh-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('clears auth and rejects queued requests when refresh fails', async () => {
    let refreshCount = 0;

    apiClient.defaults.adapter = async (config) => {
      const url = config.url ?? '';
      if (url.includes('/api/auth/refresh')) {
        refreshCount += 1;
        await new Promise((r) => setTimeout(r, 10));
        throw make401(config);
      }
      throw make401(config);
    };

    const results = await Promise.allSettled([
      apiClient.get('/api/posts'),
      apiClient.get('/api/cart'),
    ]);

    expect(refreshCount).toBe(1);
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('rejected');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('does not trigger refresh when /api/auth/login returns 401', async () => {
    let refreshCount = 0;

    apiClient.defaults.adapter = async (config) => {
      if ((config.url ?? '').includes('/api/auth/refresh')) {
        refreshCount += 1;
      }
      throw make401(config);
    };

    await expect(
      apiClient.post('/api/auth/login', { username: 'u', password: 'wrong' })
    ).rejects.toThrow();

    expect(refreshCount).toBe(0);
  });

  it('does not loop infinitely if retried request also returns 401', async () => {
    let refreshCount = 0;
    let endpointCalls = 0;

    apiClient.defaults.adapter = async (config) => {
      const url = config.url ?? '';
      if (url.includes('/api/auth/refresh')) {
        refreshCount += 1;
        return {
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config,
          data: {
            success: true,
            message: 'Refreshed',
            data: {
              accessToken: 'still-rejected-token',
              expiration: '2026-12-01T00:00:00Z',
              user: mockUser,
            },
          },
        };
      }
      endpointCalls += 1;
      throw make401(config);
    };

    await expect(apiClient.get('/api/posts')).rejects.toThrow();

    expect(refreshCount).toBe(1);
    expect(endpointCalls).toBe(2);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
