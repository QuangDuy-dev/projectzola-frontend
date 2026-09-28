import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService, feedService, postService } from '../services/api/services';

export function useSocialFeed(limit = 20) {
  const queryClient = useQueryClient();

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed', 'social'],
    queryFn: ({ pageParam }) => feedService.getSocialFeed(limit, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
  });

  const createPostMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files?: File[] }) => {
      const post = await postService.create({ content });
      if (files && files.length > 0) {
        for (const file of files) {
          await postService.addMedia(post.id, file);
        }
      }
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'social'] });
    },
  });

  const toggleReactionMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: 'Like' | 'Dislike' }) =>
      postService.toggleReaction(postId, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'social'] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      commentService.create(postId, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'social'] });
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
    },
  });

  const posts = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    posts,
    isLoading: feedQuery.isLoading,
    isFetchingNextPage: feedQuery.isFetchingNextPage,
    hasNextPage: feedQuery.hasNextPage,
    fetchNextPage: feedQuery.fetchNextPage,
    error: feedQuery.error as Error | null,
    refetch: feedQuery.refetch,
    createPost: createPostMutation.mutateAsync,
    isCreatingPost: createPostMutation.isPending,
    toggleReaction: toggleReactionMutation.mutateAsync,
    createComment: createCommentMutation.mutateAsync,
  };
}
