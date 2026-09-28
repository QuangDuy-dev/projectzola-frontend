import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService, postService } from '../services/api/services';

export function useShortsFeed(limit = 10) {
  const queryClient = useQueryClient();

  const shortsQuery = useInfiniteQuery({
    queryKey: ['feed', 'videos'],
    queryFn: ({ pageParam }) => feedService.getVideoFeed(limit, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
  });

  const toggleReactionMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: 'Like' | 'Dislike' }) =>
      postService.toggleReaction(postId, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'videos'] });
    },
  });

  const videos = shortsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    videos,
    isLoading: shortsQuery.isLoading,
    isFetchingNextPage: shortsQuery.isFetchingNextPage,
    hasNextPage: shortsQuery.hasNextPage,
    fetchNextPage: shortsQuery.fetchNextPage,
    error: shortsQuery.error as Error | null,
    refetch: shortsQuery.refetch,
    toggleReaction: toggleReactionMutation.mutateAsync,
  };
}
