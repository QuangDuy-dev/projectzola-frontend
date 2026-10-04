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
      {/* Social Post Creator Card (Modern Social Network Style) */}
      <Card
        style={{
          padding: '1.125rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(226, 232, 240, 0.75)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              padding: '2px',
              background: 'var(--color-primary-gradient)',
              boxShadow: '0 2px 8px rgba(255, 90, 0, 0.2)',
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#ffffff' }}>
              <SafeImage src={user?.avatarUrl} alt={user?.displayName || 'User'} />
            </div>
          </div>
          <div
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              flex: 1,
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-full)',
              padding: '0.7rem 1.125rem',
              fontSize: '0.9rem',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all var(--dur-feedback) var(--ease-out)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-background)';
              e.currentTarget.style.borderColor = 'var(--color-border-strong)';
            }}
          >
            <span>{user?.displayName ? `${user.displayName} ơi, bạn muốn chia sẻ điều gì hôm nay?` : 'Bạn muốn chia sẻ điều gì hôm nay?'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Tạo bài</span>
          </div>
        </div>

        {/* Creator Micro-Action Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(226, 232, 240, 0.6)',
            paddingTop: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--tint-media-bg)',
              color: 'var(--tint-media-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(2, 132, 199, 0.15)',
              transition: 'all var(--dur-feedback) var(--ease-out)',
            }}
          >
            <ImageIcon size={16} />
            <span>Ảnh / Video</span>
          </button>

          <button
            onClick={() => navigate('/shop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--tint-deal-bg)',
              color: 'var(--tint-deal-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 90, 0, 0.15)',
              transition: 'all var(--dur-feedback) var(--ease-out)',
            }}
          >
            <Flame size={16} />
            <span>Gợi ý Deal Mall</span>
          </button>

          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle size={16} />
            <span>Đăng bài viết</span>
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
