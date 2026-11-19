import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/api/services';
import { chatHubClient } from '../services/signalr/chatHubClient';
import { useAuthStore } from '../stores/authStore';
import type { ConversationDto, MessageDto, PagedResult } from '../types';
import {
  applyGroupDisbanded,
  applyGroupMemberRemoved,
  applyGroupUpdated,
  applyPinUpdate,
  applyPollUpdate,
  applyReactionUpdate,
} from '../utils/chatReducers';

export function useConversations() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isConnected, setIsConnected] = useState(chatHubClient.isConnected());

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations({ page: 1, pageSize: 50 }),
    enabled: isAuthenticated,
    // When SignalR is connected, fallback polling is set to 20s; otherwise 15s
    refetchInterval: isConnected ? 20000 : 15000,
  });

  const createConversationMutation = useMutation({
    mutationFn: (participantId: string) => chatService.getOrCreateConversation(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Subscribe to SignalR events to update conversation list in real-time
  useEffect(() => {
    if (!isAuthenticated) return;

    chatHubClient.start();

    const unsubscribe = chatHubClient.subscribe({
      onConnectionStatusChanged: (connected) => {
        setIsConnected(connected);
      },
      onReceiveMessage: (msg) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['messages', msg.conversationId] });
      },
      onConversationUpdated: (updatedConv) => {
        queryClient.setQueryData(['conversations'], (old: PagedResult<ConversationDto> | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((c) => (c.id.toLowerCase() === updatedConv.id.toLowerCase() ? updatedConv : c)),
          };
        });
        queryClient.setQueryData(['conversation', updatedConv.id], updatedConv);
      },
      onGroupUpdated: (eventData) => {
        if (eventData.conversation) {
          queryClient.setQueryData(['conversations'], (old: PagedResult<ConversationDto> | undefined) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: old.items.map((c) =>
                c.id.toLowerCase() === eventData.conversation!.id.toLowerCase() ? eventData.conversation! : c
              ),
            };
          });
          queryClient.setQueryData(['conversation', eventData.conversation.id], eventData.conversation);
        } else {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      },
      onGroupMemberAdded: (eventData) => {
        if (eventData.conversation) {
          queryClient.setQueryData(['conversations'], (old: PagedResult<ConversationDto> | undefined) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: old.items.map((c) =>
                c.id.toLowerCase() === eventData.conversation!.id.toLowerCase() ? eventData.conversation! : c
              ),
            };
          });
          queryClient.setQueryData(['conversation', eventData.conversation.id], eventData.conversation);
        } else {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      },
      onGroupMemberRemoved: (eventData) => {
        queryClient.setQueryData(['conversations'], (old: PagedResult<ConversationDto> | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((c) =>
              c.id.toLowerCase() === eventData.conversationId.toLowerCase()
                ? applyGroupMemberRemoved(c, eventData)
                : c
            ),
          };
        });
        queryClient.setQueryData(['conversation', eventData.conversationId], (old: ConversationDto | undefined) => {
          if (!old) return old;
          return applyGroupMemberRemoved(old, eventData);
        });
      },
      onGroupDisbanded: (eventData) => {
        queryClient.setQueryData(['conversations'], (old: PagedResult<ConversationDto> | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((c) =>
              c.id.toLowerCase() === eventData.conversationId.toLowerCase()
                ? applyGroupDisbanded(c, eventData)
                : c
            ),
          };
        });
        queryClient.setQueryData(['conversation', eventData.conversationId], (old: ConversationDto | undefined) => {
          if (!old) return old;
          return applyGroupDisbanded(old, eventData);
        });
      },
    });

    return unsubscribe;
  }, [isAuthenticated, queryClient]);

  return {
    conversations: conversationsQuery.data?.items ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error as Error | null,
    refetch: conversationsQuery.refetch,
    createConversation: createConversationMutation.mutateAsync,
  };
}

export function useConversationMessages(conversationId?: string) {
  const queryClient = useQueryClient();
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [loadedPages, setLoadedPages] = useState(1);

  // Reset pagination when conversation changes
  useEffect(() => {
    setLoadedPages(1);
  }, [conversationId]);

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('No conversation ID');
      const res = await chatService.getMessages(conversationId, { page: 1, pageSize: 50 });
      // The backend returns messages in descending order (newest first).
      // Normalize to chronological order (oldest to newest) for proper messenger display.
      return {
        ...res,
        items: [...res.items].reverse(),
        page: 1,
      };
    },
    enabled: !!conversationId,
    refetchInterval: chatHubClient.isConnected() ? 20000 : 15000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ content }: { content: string }) =>
      conversationId ? chatService.sendMessage(conversationId, { content }) : Promise.reject('No conversation'),
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old) return { items: [newMsg], totalCount: 1, page: 1, totalPages: 1 };
        const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === newMsg.id.toLowerCase());
        if (exists) return old;
        return {
          ...old,
          items: [...old.items, newMsg],
          totalCount: (old.totalCount ?? old.items.length) + 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (messageId: string) =>
      conversationId ? chatService.markRead(conversationId, { messageId }) : Promise.reject('No conversation'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Load older messages (previous pages from backend)
  const loadOlderMessages = async () => {
    if (!conversationId || isLoadingOlder) return;
    const currentData: any = queryClient.getQueryData(['messages', conversationId]);
    if (!currentData) return;

    const nextPage = (currentData.page ?? loadedPages) + 1;
    if (currentData.totalPages && nextPage > currentData.totalPages) {
      return;
    }

    setIsLoadingOlder(true);
    try {
      const res = await chatService.getMessages(conversationId, { page: nextPage, pageSize: 50 });
      if (res.items && res.items.length > 0) {
        // Backend returns descending, so reverse to chronological order
        const olderChronological = [...res.items].reverse();

        queryClient.setQueryData(['messages', conversationId], (old: any) => {
          if (!old) return { ...res, items: olderChronological, page: nextPage };
          const existingIds = new Set(old.items.map((m: MessageDto) => m.id.toLowerCase()));
          const filteredNewOlder = olderChronological.filter((m: MessageDto) => !existingIds.has(m.id.toLowerCase()));
          return {
            ...old,
            items: [...filteredNewOlder, ...old.items],
            page: nextPage,
            totalPages: res.totalPages,
            totalCount: res.totalCount,
          };
        });
        setLoadedPages(nextPage);
      }
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Join SignalR group and listen for real-time messages
  useEffect(() => {
    if (!conversationId) return;

    chatHubClient.joinConversation(conversationId);

    const unsubscribe = chatHubClient.subscribe({
      onReceiveMessage: (msg) => {
        if (msg.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old) return { items: [msg], totalCount: 1, page: 1, totalPages: 1 };
            const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === msg.id.toLowerCase());
            if (exists) return old;
            return {
              ...old,
              items: [...old.items, msg],
              totalCount: (old.totalCount ?? old.items.length) + 1,
            };
          });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      },
      onMessageUpdated: (updated) => {
        if (updated.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((m: MessageDto) => (m.id.toLowerCase() === updated.id.toLowerCase() ? updated : m)),
            };
          });
        }
      },
      onMessageDeleted: (deleted) => {
        if (deleted.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((m: MessageDto) =>
                m.id.toLowerCase() === deleted.messageId.toLowerCase() ? { ...m, isDeleted: true, content: 'Tin nhắn đã bị thu hồi' } : m
              ),
            };
          });
        }
      },
      onMessageReactionUpdated: (eventData) => {
        if (eventData.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: applyReactionUpdate(old.items, eventData),
            };
          });
        }
      },
      onMessagePinned: (eventData) => {
        if (eventData.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: applyPinUpdate(old.items, eventData),
            };
          });
          queryClient.invalidateQueries({ queryKey: ['pinned-messages', conversationId] });
        }
      },
      onMessageUnpinned: (eventData) => {
        if (eventData.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: applyPinUpdate(old.items, eventData),
            };
          });
          queryClient.invalidateQueries({ queryKey: ['pinned-messages', conversationId] });
        }
      },
      onPollUpdated: (eventData) => {
        if (eventData.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: applyPollUpdate(old.items, eventData),
            };
          });
        }
      },
      onGroupUpdated: (eventData) => {
        if (eventData.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          if (eventData.systemMessage) {
            queryClient.setQueryData(['messages', conversationId], (old: any) => {
              if (!old?.items) return old;
              const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === eventData.systemMessage!.id.toLowerCase());
              if (exists) return old;
              return {
                ...old,
                items: [...old.items, eventData.systemMessage],
                totalCount: (old.totalCount ?? old.items.length) + 1,
              };
            });
          }
        }
      },
      onGroupMemberAdded: (eventData) => {
        if (eventData.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          if (eventData.systemMessage) {
            queryClient.setQueryData(['messages', conversationId], (old: any) => {
              if (!old?.items) return old;
              const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === eventData.systemMessage!.id.toLowerCase());
              if (exists) return old;
              return {
                ...old,
                items: [...old.items, eventData.systemMessage],
                totalCount: (old.totalCount ?? old.items.length) + 1,
              };
            });
          }
        }
      },
      onGroupMemberRemoved: (eventData) => {
        if (eventData.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          if (eventData.systemMessage) {
            queryClient.setQueryData(['messages', conversationId], (old: any) => {
              if (!old?.items) return old;
              const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === eventData.systemMessage!.id.toLowerCase());
              if (exists) return old;
              return {
                ...old,
                items: [...old.items, eventData.systemMessage],
                totalCount: (old.totalCount ?? old.items.length) + 1,
              };
            });
          }
        }
      },
      onGroupDisbanded: (eventData) => {
        if (eventData.conversationId.toLowerCase() === conversationId.toLowerCase()) {
          if (eventData.systemMessage) {
            queryClient.setQueryData(['messages', conversationId], (old: any) => {
              if (!old?.items) return old;
              const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === eventData.systemMessage!.id.toLowerCase());
              if (exists) return old;
              return {
                ...old,
                items: [...old.items, eventData.systemMessage],
                totalCount: (old.totalCount ?? old.items.length) + 1,
              };
            });
          }
        }
      },
    });

    return unsubscribe;
  }, [conversationId, queryClient]);

  const hasOlderMessages = messagesQuery.data
    ? (messagesQuery.data.page ?? 1) < (messagesQuery.data.totalPages ?? 1)
    : false;

  return {
    messages: messagesQuery.data?.items ?? [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error as Error | null,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    markRead: markReadMutation.mutateAsync,
    loadOlderMessages,
    hasOlderMessages,
    isLoadingOlder,
  };
}

export function usePinnedMessages(conversationId?: string) {
  const query = useQuery({
    queryKey: ['pinned-messages', conversationId],
    queryFn: () => (conversationId ? chatService.getPinnedMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
    staleTime: 60000,
  });

  return {
    pinnedMessages: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useConversationDetails(conversationId?: string) {
  const query = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => (conversationId ? chatService.getConversation(conversationId) : Promise.reject('No conversation ID')),
    enabled: !!conversationId,
  });

  return {
    conversation: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
