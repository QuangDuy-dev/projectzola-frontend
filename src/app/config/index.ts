export const APP_CONFIG = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5114').replace(/\/+$/, ''),
  get signalrChatUrl() {
    return `${this.apiBaseUrl}/hubs/chat`;
  },
  defaultPageSize: 20,
  maxSearchPageSize: 50,
  maxUploadImageSizeBytes: 5 * 1024 * 1024,
  maxUploadVideoSizeBytes: 200 * 1024 * 1024,
  debounceTimeMs: 300,
};
