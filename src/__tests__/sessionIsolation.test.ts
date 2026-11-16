import { beforeEach, describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../services/api/apiClient';
import { useAuthStore } from '../stores/authStore';
import type { UserInfoDto } from '../types';

const account = (id: string): UserInfoDto => ({ id, username: id, displayName: id, email: `${id}@example.com`, role: 'User', avatarUrl: null });

describe('HTTP session isolation', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('keeps account B when a pending request for A returns 401', async () => {
    useAuthStore.getState().setAuth('token-a', account('a'));
    let rejectOldRequest!: () => void;
    let requestStarted!: () => void;
    const started = new Promise<void>((resolve) => { requestStarted = resolve; });
    const pending = apiClient.get('/auth/me', {
      adapter: (config: InternalAxiosRequestConfig) => new Promise((_resolve, reject) => {
        rejectOldRequest = () => reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
          status: 401, statusText: 'Unauthorized', data: {}, headers: new AxiosHeaders(), config,
        }));
        requestStarted();
      }),
    }).catch((error) => error);
    await started;
    useAuthStore.getState().setAuth('token-b', account('b'));
    rejectOldRequest();
    await pending;
    expect(useAuthStore.getState().token).toBe('token-b');
    expect(useAuthStore.getState().user?.id).toBe('b');
  });

  it('clears the matching session when its own request returns 401', async () => {
    useAuthStore.getState().setAuth('token-a', account('a'));
    await apiClient.get('/auth/me', {
      adapter: async (config) => { throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
        status: 401, statusText: 'Unauthorized', data: {}, headers: new AxiosHeaders(), config,
      }); },
    }).catch(() => undefined);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
