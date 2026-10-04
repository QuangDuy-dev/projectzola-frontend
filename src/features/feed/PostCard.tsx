import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, ThumbsDown, ThumbsUp, Send } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SafeImage } from '../../components/common/SafeImage';
import { SafeVideo } from '../../components/common/SafeVideo';
import { UserAvatar } from '../../components/common/UserAvatar';
import { UserIdentity } from '../../components/common/UserIdentity';
import { formatRelativeTime } from '../../utils/formatters';
import { commentService } from '../../services/api/services';
import type { FeedPostDto } from '../../types';

export interface PostCardProps {
  post: FeedPostDto;
  onToggleReaction: (postId: string, type: 'Like' | 'Dislike') => Promise<any>;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onToggleReaction }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Comments query
  const commentsQuery = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => commentService.getByPost(post.id, { page: 1, pageSize: 20 }),
    enabled: showComments,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => commentService.create(post.id, { content }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'social'] });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  const images = post.media.filter((m) => m.mediaType === 'Image');
  const videos = post.media.filter((m) => m.mediaType === 'Video');

  return (
    <Card
      className="card-hover-lift"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(226, 232, 240, 0.75)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Author Header */}
      <UserIdentity
        userId={post.author?.id || post.userId}
        displayName={post.author?.displayName || post.authorName || 'Người dùng'}
        username={post.author?.username}
        avatarUrl={post.author?.avatarUrl || post.authorAvatarUrl}
        timestamp={post.createdAt}
        avatarSize={42}
      />

      {/* Post Text */}
      <p style={{ fontSize: '0.9375rem', lineHeight: '1.65', whiteSpace: 'pre-line', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
        {post.content}
      </p>

      {/* Media: Video */}
      {videos.length > 0 && (
        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxHeight: '460px', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
          <SafeVideo videoUrl={videos[0].url} posterUrl={videos[0].thumbnailUrl} />
        </div>
      )}

      {/* Media: Image Grid */}
      {images.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid rgba(226, 232, 240, 0.6)',
          }}
        >
          {images.map((img) => (
            <div key={img.id} style={{ height: images.length === 1 ? '380px' : '200px', overflow: 'hidden' }}>
              <SafeImage
                src={img.url}
                alt="post media"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s var(--ease-out)',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Metrics Row */}
      {(post.likeCount > 0 || post.commentCount > 0) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            paddingTop: '0.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--color-primary-gradient)',
                color: '#ffffff',
                fontSize: '11px',
                boxShadow: '0 2px 6px rgba(255, 90, 0, 0.3)',
              }}
            >
              👍
            </span>
            <span>{post.likeCount} lượt thích</span>
          </div>
          <span>{post.commentCount} bình luận</span>
        </div>
      )}

      {/* Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          paddingTop: '0.625rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant={post.currentUserReaction === 'Like' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onToggleReaction(post.id, 'Like')}
          >
            <ThumbsUp size={16} />
            <span>Thích</span>
          </Button>

          <Button
            variant={post.currentUserReaction === 'Dislike' ? 'danger' : 'ghost'}
            size="sm"
            onClick={() => onToggleReaction(post.id, 'Dislike')}
          >
            <ThumbsDown size={16} />
            <span>Không thích</span>
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setShowComments((prev) => !prev)}>
          <MessageCircle size={16} />
          <span>Bình luận</span>
        </Button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận..."
              style={{
                flex: 1,
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-hover)',
                outline: 'none',
                fontSize: '0.875rem',
                transition: 'border-color var(--dur-feedback) var(--ease-out)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              }}
            />
            <Button type="submit" size="sm" isLoading={addCommentMutation.isPending}>
              <Send size={14} />
            </Button>
          </form>

          {/* Comment List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
            {commentsQuery.isLoading && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Đang tải bình luận...</span>
            )}
            {commentsQuery.data?.items.map((comment) => {
              const commenterId = comment.userId;
              const commenterName = comment.displayName || comment.username || comment.authorName || 'Người dùng';
              const commenterAvatar = comment.userAvatarUrl || comment.authorAvatarUrl;

              return (
                <div
                  key={comment.id}
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    gap: '0.625rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <UserAvatar
                    userId={commenterId}
                    avatarUrl={commenterAvatar}
                    displayName={commenterName}
                    size={32}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        onClick={() => commenterId && navigate(`/users/${commenterId}`)}
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: 'var(--color-text)',
                          cursor: commenterId ? 'pointer' : 'default',
                        }}
                      >
                        {commenterName}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', wordBreak: 'break-word' }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })}
            {commentsQuery.data?.items.length === 0 && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                Chưa có bình luận nào. Hãy là người đầu tiên!
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
