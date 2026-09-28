import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Flame, ThumbsDown, ThumbsUp, Volume2, VolumeX } from 'lucide-react';
import { useShortsFeed } from '../../hooks/useShorts';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { UserAvatar } from '../../components/common/UserAvatar';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatRelativeTime } from '../../utils/formatters';

export const ShortsFeedPage: React.FC = () => {
  const { videos, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error, refetch, toggleReaction } =
    useShortsFeed();

  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Automatically fetch next batch when user is 2 videos away from end
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, videos.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Manage video playback: play active video, pause all others
  useEffect(() => {
    videoRefs.current.forEach((videoEl, idx) => {
      if (!videoEl) return;
      if (idx === currentIndex) {
        videoEl.muted = isMuted;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked: mute and retry
            videoEl.muted = true;
            setIsMuted(true);
            videoEl.play().catch(() => {});
          });
        }
      } else {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
    });
  }, [currentIndex, isMuted, videos]);

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (isLoading) return <LoadingState message="Đang tải video ngắn..." />;
  if (error) return <ErrorState title="Lỗi tải Shorts" message={error.message} onRetry={() => refetch()} />;
  if (videos.length === 0) {
    return (
      <EmptyState
        icon={<Flame size={32} />}
        title="Chưa có video ngắn nào"
        message="Hãy đăng bài viết đính kèm video ngắn (≤ 60s) ở trang Bảng tin để hiển thị tại đây!"
      />
    );
  }

  const currentPost = videos[currentIndex];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - var(--header-height) - 3rem)',
        position: 'relative',
      }}
    >
      {/* Video Container (9:16 vertical player) */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          maxHeight: '740px',
          backgroundColor: '#000000',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {videos.map((post, idx) => {
          const vMedia = post.media.find((m) => m.mediaType === 'Video');
          if (!vMedia) return null;
          const isCurrent = idx === currentIndex;
          const shouldPreload = Math.abs(idx - currentIndex) <= 1;

          return (
            <video
              key={post.id}
              ref={(el) => {
                videoRefs.current[idx] = el;
              }}
              src={resolveMediaUrl(vMedia.url) || undefined}
              poster={resolveMediaUrl(vMedia.thumbnailUrl) || undefined}
              preload={isCurrent ? 'auto' : shouldPreload ? 'metadata' : 'none'}
              loop
              playsInline
              muted={isMuted}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                inset: 0,
                opacity: isCurrent ? 1 : 0,
                pointerEvents: isCurrent ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
              }}
              onClick={() => {
                const el = videoRefs.current[idx];
                if (el) {
                  if (el.paused) el.play();
                  else el.pause();
                }
              }}
            />
          );
        })}

        {/* Mute / Unmute Toggle button */}
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: '#fff',
            padding: '0.5rem',
            borderRadius: '50%',
            zIndex: 10,
          }}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Video Overlay Info (Bottom) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1.5rem 1rem',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <UserAvatar
              userId={currentPost.author?.id || currentPost.userId}
              avatarUrl={currentPost.author?.avatarUrl || currentPost.authorAvatarUrl}
              displayName={currentPost.author?.displayName || currentPost.authorName}
              size={36}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                onClick={() => {
                  const aId = currentPost.author?.id || currentPost.userId;
                  if (aId) navigate(`/users/${aId}`);
                }}
                style={{
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
              >
                {currentPost.author?.displayName || currentPost.authorName || 'Người dùng'}
              </span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                {formatRelativeTime(currentPost.createdAt)}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.875rem', opacity: 0.9, maxHeight: '60px', overflowY: 'auto' }}>
            {currentPost.content}
          </p>
        </div>

        {/* Right Floating Actions (Like, Dislike) */}
        <div
          style={{
            position: 'absolute',
            right: '1rem',
            bottom: '5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 15,
          }}
        >
          <button
            onClick={() => toggleReaction({ postId: currentPost.id, type: 'Like' })}
            style={{
              backgroundColor: currentPost.currentUserReaction === 'Like' ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
              color: '#ffffff',
              padding: '0.75rem',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <ThumbsUp size={20} />
            <span style={{ fontSize: '0.6875rem' }}>{currentPost.likeCount}</span>
          </button>

          <button
            onClick={() => toggleReaction({ postId: currentPost.id, type: 'Dislike' })}
            style={{
              backgroundColor: currentPost.currentUserReaction === 'Dislike' ? 'var(--color-danger)' : 'rgba(0,0,0,0.5)',
              color: '#ffffff',
              padding: '0.75rem',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <ThumbsDown size={20} />
            <span style={{ fontSize: '0.6875rem' }}>{currentPost.dislikeCount}</span>
          </button>
        </div>
      </div>

      {/* Navigation Buttons (Up / Down) */}
      <div
        style={{
          position: 'absolute',
          right: 'max(1rem, calc(50% - 280px))',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === 0}
          onClick={handlePrev}
          style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
        >
          <ChevronUp size={20} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex >= videos.length - 1}
          onClick={handleNext}
          style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
        >
          <ChevronDown size={20} />
        </Button>
      </div>
    </div>
  );
};
