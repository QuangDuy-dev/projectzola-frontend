import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { presenceService } from '../services/api/services';
import { chatHubClient } from '../services/signalr/chatHubClient';
import { useAuthStore } from '../stores/authStore';
import type { OnlineFriendDto, UserPresenceDto } from '../types';

export function usePresence() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [realtimePresence, setRealtimePresence] = useState<Record<string, { isOnline: boolean; lastSeenAt?: string }>>({});

  const onlineFriendsQuery = useQuery({
    queryKey: ['presence', 'online-friends'],
    queryFn: presenceService.getOnlineFriends,
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Listen to realtime presence changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = chatHubClient.subscribe({
      onUserPresenceChanged: (eventData: UserPresenceDto) => {
        const uid = eventData.userId.toLowerCase();
        setRealtimePresence((prev) => ({
          ...prev,
          [uid]: {
            isOnline: eventData.isOnline,
            lastSeenAt: eventData.timestamp,
          },
        }));

        queryClient.setQueryData<OnlineFriendDto[]>(['presence', 'online-friends'], (old) => {
          if (!old) return old;
          return old.map((f) => {
            if (f.userId.toLowerCase() === uid) {
              return {
                ...f,
                isOnline: eventData.isOnline,
                lastSeenAt: eventData.timestamp,
              };
            }
            return f;
          });
        });
      },
    });

    return unsubscribe;
  }, [isAuthenticated, queryClient]);

  const friendsList = onlineFriendsQuery.data ?? [];

  // Build a lookup map combining initial data and realtime overrides
  const presenceMap = useMemo(() => {
    const map = new Map<string, { isOnline: boolean; lastSeenAt?: string | null }>();

    for (const f of friendsList) {
      map.set(f.userId.toLowerCase(), {
        isOnline: f.isOnline,
        lastSeenAt: f.lastSeenAt,
      });
    }

    for (const [uid, status] of Object.entries(realtimePresence)) {
      map.set(uid.toLowerCase(), status);
    }

    return map;
  }, [friendsList, realtimePresence]);

  const isOnline = (userId?: string): boolean => {
    if (!userId) return false;
    return presenceMap.get(userId.toLowerCase())?.isOnline ?? false;
  };

  const getLastSeen = (userId?: string): string | null => {
    if (!userId) return null;
    return presenceMap.get(userId.toLowerCase())?.lastSeenAt ?? null;
  };

  return {
    onlineFriends: friendsList,
    isLoading: onlineFriendsQuery.isLoading,
    isOnline,
    getLastSeen,
    refetch: onlineFriendsQuery.refetch,
  };
}
