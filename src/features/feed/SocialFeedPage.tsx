import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { useSocialFeed } from '../../hooks/useFeed';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SafeImage } from '../../components/common/SafeImage';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const SocialFeedPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Social Post Composer Box (Facebook / Zalo Style) */}
      <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid var(--color-primary-light)',
            }}
          >
            <SafeImage src={user?.avatarUrl} alt={user?.displayName || 'User'} />
          </div>
          <div
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              flex: 1,
              backgroundColor: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color var(--dur-feedback) var(--ease-out)',
            }}
          >
            {user?.displayName ? `${user.displayName} ơi, bạn đang chia sẻ điều gì hôm nay?` : 'Bạn đang nghĩ gì thế?'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem' }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'all var(--dur-feedback) var(--ease-out)',
            }}
          >
            <ImageIcon size={18} style={{ color: '#10b981' }} />
            <span>Ảnh / Video</span>
          </button>

          <button
            onClick={() => navigate('/shorts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'all var(--dur-feedback) var(--ease-out)',
            }}
          >
            <Flame size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Khám phá Shorts</span>
          </button>

          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle size={16} />
            <span>Đăng bài</span>
          </Button>
        </div>
      </Card>

      {/* Feed Content */}
      {isLoading && <LoadingState message="Đang tải bảng tin mạng xã hội..." />}

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
