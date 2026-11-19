import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '../../app/config';
import { useAuthStore } from '../../stores/authStore';
import type { ApiResponse, AuthResponse } from '../../types';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 30000,
});

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  );
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const tokenAtStart = useAuthStore.getState().accessToken;

  refreshPromise = (async () => {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>(
        '/api/auth/refresh',
        undefined,
        { withCredentials: true }
      );
      const data = res.data?.data;
      if (!data?.accessToken) {
        throw new Error('Refresh response missing accessToken');
      }

      if (data.user) {
        useAuthStore.getState().setAuth(data.accessToken, data.user);
      } else {
        useAuthStore.getState().updateAccessToken(data.accessToken);
      }

      return data.accessToken;
    } catch (err) {
      if (useAuthStore.getState().accessToken === tokenAtStart) {
        useAuthStore.getState().clearAuth();
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Request Interceptor: Attach JWT Token & handle FormData
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // When payload is FormData, remove Content-Type so Axios & browser can set
    // 'multipart/form-data; boundary=...' automatically without being overridden by default application/json.
    if (
      typeof FormData !== 'undefined' &&
      (config.data instanceof FormData ||
        Object.prototype.toString.call(config.data) === '[object FormData]')
    ) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else if (config.headers) {
        delete (config.headers as Record<string, any>)['Content-Type'];
        delete (config.headers as Record<string, any>)['content-type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize errors & handle 401 single-flight refresh
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns ApiResponse<T>, response.data will have { success, data, message, errors }
    return response;
  },
  async (error: AxiosError<ApiResponse<any> & { title?: string; detail?: string; errors?: string[] | Record<string, string[]> }>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const currentToken = useAuthStore.getState().accessToken;
    const requestAuth = originalRequest?.headers?.Authorization;
    const matchesActiveSession = Boolean(
      currentToken && (!requestAuth || requestAuth === `Bearer ${currentToken}`)
    );

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url) &&
      matchesActiveSession
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    if (
      error.response?.status === 401 &&
      originalRequest?._retry &&
      matchesActiveSession
    ) {
      useAuthStore.getState().clearAuth();
    }

    // Extract standardized message (supports ApiResponse<T> & ASP.NET ValidationProblemDetails)
    let message = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    const backendData = error.response?.data;
    let normalizedErrors: string[] | undefined;

    if (backendData?.errors) {
      if (Array.isArray(backendData.errors) && backendData.errors.length > 0) {
        normalizedErrors = backendData.errors;
      } else if (typeof backendData.errors === 'object') {
        const flatErrors = Object.values(backendData.errors)
          .flat()
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        if (flatErrors.length > 0) {
          normalizedErrors = flatErrors;
        }
      }
    }

    if (backendData?.message) {
      message = backendData.message;
    } else if (normalizedErrors && normalizedErrors.length > 0) {
      message = normalizedErrors.join(' ');
    } else if (backendData?.detail) {
      message = backendData.detail;
    } else if (backendData?.title) {
      message = backendData.title;
    } else if (error.message) {
      message = error.message;
    }

    // Normalized error object
    const normalizedError = new Error(message) as Error & {
      statusCode?: number;
      errors?: string[];
    };
    normalizedError.statusCode = error.response?.status;
    normalizedError.errors = normalizedErrors;

    return Promise.reject(normalizedError);
  }
);
