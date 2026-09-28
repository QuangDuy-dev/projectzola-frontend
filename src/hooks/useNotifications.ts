import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/api/services';
import { chatHubClient } from '../services/signalr/chatHubClient';
import { useAuthStore } from '../stores/authStore';

export function useNotifications() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll({ page: 1, pageSize: 30 }),
    enabled: isAuthenticated,
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData(['notifications', 'unread-count'], 0);
    },
  });

  // Listen to SignalR real-time notification events
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = chatHubClient.subscribe({
      onNotificationReceived: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.setQueryData<number>(['notifications', 'unread-count'], (prev = 0) => prev + 1);
      },
      onNotificationCountChanged: (data) => {
        queryClient.setQueryData(['notifications', 'unread-count'], data.unreadCount);
      },
      onNotificationRead: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });

    return unsubscribe;
  }, [isAuthenticated, queryClient]);

  return {
    notifications: notificationsQuery.data?.items ?? [],
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error as Error | null,
    refetch: notificationsQuery.refetch,
    markAsRead: markReadMutation.mutateAsync,
    markAllAsRead: markAllReadMutation.mutateAsync,
  };
}
