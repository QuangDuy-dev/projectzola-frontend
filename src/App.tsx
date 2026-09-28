import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './app/router/AppRouter';
import { useAuthStore } from './stores/authStore';
import { authService } from './services/api/services';
import { chatHubClient } from './services/signalr/chatHubClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Sync / verify user session on initial boot if token exists
  useEffect(() => {
    if (token) {
      chatHubClient.start();
      authService
        .getMe()
        .then((user) => {
          setAuth(token, user);
        })
        .catch(() => {
          // If token is invalid / expired, clear session
          clearAuth();
          chatHubClient.stop();
        });
    } else {
      chatHubClient.stop();
    }
  }, [token]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
