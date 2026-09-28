import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useSocialFeed } from '../../hooks/useFeed';
import { Button } from '../../components/ui/Button';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const SocialFeedPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    posts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
    createPost,
    toggleReaction,
  } = useSocialFeed();

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Feed Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-surface)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bảng tin mạng xã hội</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Cập nhật tin mới từ những người bạn theo dõi
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle size={18} />
          Đăng bài
        </Button>
      </div>

      {/* Feed Content */}
      {isLoading && <LoadingState message="Đang tải bảng tin..." />}

      {error && (
        <ErrorState
          title="Không thể tải bảng tin"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && posts.length === 0 && (
        <EmptyState
          title="Bảng tin của bạn đang trống"
          message="Hãy tạo bài viết đầu tiên hoặc theo dõi thêm người dùng khác để thấy bảng tin."
          action={
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle size={16} /> Tạo bài viết ngay
            </Button>
          }
        />
      )}

      {!isLoading &&
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleReaction={(id, type) => toggleReaction({ postId: id, type })}
          />
        ))}

      {/* Pagination / Load More */}
      {hasNextPage && (
        <div style={{ textAlign: 'center', margin: '1rem 0 2rem' }}>
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
            disabled={isFetchingNextPage}
          >
            Tải thêm bài viết cũ hơn
          </Button>
        </div>
      )}

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createPost}
      />
    </div>
  );
};
