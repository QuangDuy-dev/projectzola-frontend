import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api/services';
import { chatHubClient } from '../services/signalr/chatHubClient';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      chatHubClient.start();
      queryClient.clear();
      navigate('/feed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      chatHubClient.start();
      queryClient.clear();
      navigate('/feed');
    },
  });

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const logout = () => {
    clearAuth();
    chatHubClient.stop();
    queryClient.clear();
    navigate('/login');
  };

  return {
    user,
    accessToken,
    token: accessToken,
    isAuthenticated,
    role: user?.role,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error as Error | null,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error as Error | null,
    logout,
    updateUser,
    updateUserInfo: updateUser,
    refetchMe: meQuery.refetch,
  };
}
