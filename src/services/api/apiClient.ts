import axios, { AxiosError } from 'axios';
import { APP_CONFIG } from '../../app/config';
import { useAuthStore } from '../../stores/authStore';
import type { ApiResponse } from '../../types';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize errors & handle 401
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns ApiResponse<T>, response.data will have { success, data, message, errors }
    return response;
  },
  (error: AxiosError<ApiResponse<any> & { title?: string; detail?: string; errors?: string[] | Record<string, string[]> }>) => {
    if (error.response?.status === 401 && error.config?.headers.Authorization === `Bearer ${useAuthStore.getState().accessToken}`) {
      // Clear expired / invalid token
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
