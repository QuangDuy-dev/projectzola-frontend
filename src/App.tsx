import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './app/router/AppRouter';
import { useAuthStore } from './stores/authStore';
import { authService } from './services/api/services';
import { chatHubClient } from './services/signalr/chatHubClient';
import { CallProvider } from './features/call/contexts/CallContext';
import { CallOverlayRoot } from './features/call/components/CallOverlayRoot';

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

  // Sync / verify user session on initial boot if token exists
  useEffect(() => {
    let cancelled = false;
    queryClient.clear();
    if (token) {
      chatHubClient.start();
      authService
        .getMe()
        .then((user) => {
          if (!cancelled) useAuthStore.getState().verifySession(token, user);
        })
        .catch((error) => {
          if (!cancelled && useAuthStore.getState().token === token && error.statusCode === 401) {
            useAuthStore.getState().clearAuth();
          }
        });
    } else {
      chatHubClient.stop();
    }
    return () => { cancelled = true; void chatHubClient.stop(); };
  }, [token]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CallProvider>
          <AppRouter />
          <CallOverlayRoot />
        </CallProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
