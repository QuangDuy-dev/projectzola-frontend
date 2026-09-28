import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Edit3,
  UserCheck,
  UserPlus,
  Calendar,
  Grid,
  Heart,
  MessageCircle,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { chatService, userService } from '../../services/api/services';
import { UserAvatar } from '../../components/common/UserAvatar';
import { SafeImage } from '../../components/common/SafeImage';
import { SafeVideo } from '../../components/common/SafeVideo';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import type { PostDto, PublicUserProfileDto, UserDto } from '../../types';

export const ProfilePage: React.FC = () => {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const { user: currentUser, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isOwnProfile = !routeUserId || routeUserId === currentUser?.id;
  const targetUserId = isOwnProfile ? currentUser?.id : routeUserId;

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [isFollowListOpen, setIsFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following'>('followers');
  const [isCopiedId, setIsCopiedId] = useState(false);

  const handleCopyId = () => {
    if (profileData?.id) {
      navigator.clipboard.writeText(profileData.id);
      setIsCopiedId(true);
      setTimeout(() => setIsCopiedId(false), 2000);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query user info
  // If own profile, query full user info; if other user, query safe public profile
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<PublicUserProfileDto | UserDto>({
    queryKey: ['profile', targetUserId, isOwnProfile],
    queryFn: async () => {
      if (!targetUserId) throw new Error('No user ID');
      if (isOwnProfile) {
        return await userService.getById(targetUserId);
      } else {
        return await userService.getPublicProfile(targetUserId);
      }
    },
    enabled: !!targetUserId,
  });

  // Query user's posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ['user-posts', targetUserId],
    queryFn: () => userService.getUserPosts(targetUserId!, { page: 1, pageSize: 20 }),
    enabled: !!targetUserId,
  });

  // Query followers / following for modal
  const { data: followersData, isLoading: isLoadingFollowers } = useQuery({
    queryKey: ['user-followers', targetUserId],
    queryFn: () => userService.getFollowers(targetUserId!),
    enabled: isFollowListOpen && followListType === 'followers' && !!targetUserId,
  });

  const { data: followingData, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['user-following', targetUserId],
    queryFn: () => userService.getFollowing(targetUserId!),
    enabled: isFollowListOpen && followListType === 'following' && !!targetUserId,
  });

  useEffect(() => {
    if (profileData && isOwnProfile) {
      setDisplayNameInput(profileData.displayName || '');
      setBioInput(profileData.bio || '');
    }
  }, [profileData, isOwnProfile]);

  // Edit profile mutation (own profile only)
  const editProfileMutation = useMutation({
    mutationFn: (data: { displayName: string; bio: string }) =>
      userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['profile', targetUserId, true], updatedUser);
      if (currentUser) {
        updateUserInfo({
          ...currentUser,
          displayName: updatedUser.displayName,
          bio: updatedUser.bio,
        });
      }
      setIsEditOpen(false);
    },
  });

  // Avatar upload mutation (own profile only)
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => userService.updateAvatar(file),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['profile', targetUserId, true], updatedUser);
      if (currentUser) {
        updateUserInfo({
          ...currentUser,
          avatarUrl: updatedUser.avatarUrl,
        });
      }
    },
  });

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: (id: string) => userService.follow(id),
    onSuccess: () => {
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-followers', targetUserId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (id: string) => userService.unfollow(id),
    onSuccess: () => {
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-followers', targetUserId] });
    },
  });

  // Start chat mutation
  const startChatMutation = useMutation({
    mutationFn: (participantId: string) => chatService.getOrCreateConversation(participantId),
    onSuccess: () => {
      navigate('/chat');
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    editProfileMutation.mutate({
      displayName: displayNameInput.trim(),
      bio: bioInput.trim(),
    });
  };

  if (!targetUserId) {
    return <ErrorState message="Không tìm thấy mã người dùng hợp lệ." />;
  }

  if (isLoadingProfile) {
    return <LoadingState message="Đang tải thông tin hồ sơ..." />;
  }

  if (profileError || !profileData) {
    return (
      <ErrorState
        message="Không thể tải thông tin người dùng này."
        onRetry={() => refetchProfile()}
      />
    );
  }

  // Normalize counts and fields across UserDto and PublicUserProfileDto
  const followersCount = (profileData as any).followerCount ?? (profileData as any).followersCount ?? 0;
  const followingCount = (profileData as any).followingCount ?? 0;
  const postsCount = (profileData as any).postCount ?? (profileData as any).postsCount ?? postsData?.totalCount ?? 0;
  const isFollowing = (profileData as any).isFollowing ?? false;
  const role = (profileData as any).role;

  const posts = postsData?.items || [];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Header Card */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
          {/* Avatar Section */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--color-primary-light)',
                backgroundColor: 'var(--color-surface-hover)',
              }}
            >
              <UserAvatar
                avatarUrl={profileData.avatarUrl}
                displayName={profileData.displayName || profileData.username}
                size={120}
                clickable={false}
              />
            </div>

            {isOwnProfile && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                  title="Thay đổi ảnh đại diện"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={18} />
                </button>
              </>
            )}
          </div>

          {/* Details Section */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {profileData.displayName}
              </h2>
              {isOwnProfile && role && <Badge variant="primary">{role}</Badge>}
            </div>

            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              @{profileData.username}
            </p>

            {/* User ID Badge with Click to Copy */}
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <div
                onClick={handleCopyId}
                title="Nhấn để sao chép mã User ID"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  userSelect: 'all',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>ID:</span>
                <code
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                  }}
                >
                  {profileData.id}
                </code>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: isCopiedId ? 'var(--color-success)' : 'var(--color-text-muted)',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    marginLeft: '0.25rem',
                  }}
                >
                  {isCopiedId ? <Check size={14} /> : <Copy size={14} />}
                  <span>{isCopiedId ? 'Đã sao chép!' : 'Sao chép'}</span>
                </span>
              </div>
            </div>

            {profileData.bio ? (
              <p style={{ marginTop: '0.75rem', fontSize: '0.9375rem', color: 'var(--color-text)', maxWidth: '500px', margin: '0.75rem auto 0' }}>
                {profileData.bio}
              </p>
            ) : (
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                Chưa có tiểu sử giới thiệu.
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', justifyContent: 'center' }}>
              <Calendar size={14} />
              <span>Tham gia từ {profileData.createdAt ? formatDate(profileData.createdAt) : 'Gần đây'}</span>
            </div>

            {/* Counts (Posts, Followers, Following) */}
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                marginTop: '1.25rem',
                justifyContent: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', display: 'block' }}>
                  {postsCount}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Bài viết</span>
              </div>

              <div
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => {
                  setFollowListType('followers');
                  setIsFollowListOpen(true);
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                  {followersCount}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Người theo dõi</span>
              </div>

              <div
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => {
                  setFollowListType('following');
                  setIsFollowListOpen(true);
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                  {followingCount}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Đang theo dõi</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDisplayNameInput(profileData.displayName);
                    setBioInput(profileData.bio || '');
                    setIsEditOpen(true);
                  }}
                >
                  <Edit3 size={16} />
                  <span>Chỉnh sửa thông tin</span>
                </Button>
              ) : (
                <>
                  {isFollowing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unfollowMutation.mutate(profileData.id)}
                      isLoading={unfollowMutation.isPending}
                    >
                      <UserCheck size={16} />
                      <span>Đang theo dõi</span>
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => followMutation.mutate(profileData.id)}
                      isLoading={followMutation.isPending}
                    >
                      <UserPlus size={16} />
                      <span>Theo dõi</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startChatMutation.mutate(profileData.id)}
                    isLoading={startChatMutation.isPending}
                  >
                    <Send size={16} />
                    <span>Nhắn tin</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Posts Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Grid size={18} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Danh sách bài đăng ({posts.length})
          </h3>
        </div>

        {isLoadingPosts ? (
          <LoadingState message="Đang tải danh sách bài viết..." />
        ) : posts.length === 0 ? (
          <EmptyState
            title="Chưa có bài đăng nào"
            description={isOwnProfile ? 'Bạn chưa xuất bản bài viết nào.' : 'Người dùng này chưa xuất bản bài viết nào.'}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {posts.map((post: PostDto) => (
              <Card key={post.id} style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {post.media && post.media.length > 0 ? (
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      backgroundColor: '#000000',
                    }}
                  >
                    {post.media[0].mediaType === 'Video' ? (
                      <SafeVideo
                        src={post.media[0].url}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <SafeImage
                        src={post.media[0].url}
                        alt="Post media"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      height: '100px',
                      backgroundColor: 'var(--color-surface-hover)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-muted)',
                      overflow: 'hidden',
                    }}
                  >
                    {post.content}
                  </div>
                )}

                <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', maxHeight: '2.5rem', overflow: 'hidden' }}>
                  {post.content}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Heart size={14} /> {post.likeCount}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MessageCircle size={14} /> {post.commentCount}
                    </span>
                  </div>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Chỉnh sửa thông tin cá nhân"
      >
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Tên hiển thị"
            value={displayNameInput}
            onChange={(e) => setDisplayNameInput(e.target.value)}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>
              Tiểu sử (Bio)
            </label>
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              rows={3}
              style={{
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                outline: 'none',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
              placeholder="Giới thiệu đôi nét về bản thân..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={editProfileMutation.isPending}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Followers / Following List Modal */}
      <Modal
        isOpen={isFollowListOpen}
        onClose={() => setIsFollowListOpen(false)}
        title={followListType === 'followers' ? 'Danh sách người theo dõi' : 'Danh sách đang theo dõi'}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {followListType === 'followers' ? (
            isLoadingFollowers ? (
              <LoadingState message="Đang tải người theo dõi..." />
            ) : followersData?.items && followersData.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followersData.items.map((u: UserDto) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setIsFollowListOpen(false);
                      navigate(`/users/${u.id}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <UserAvatar
                        avatarUrl={u.avatarUrl}
                        displayName={u.displayName || u.username}
                        size={36}
                        clickable={false}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          {u.displayName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          @{u.username}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Trống" description="Chưa có người theo dõi nào." />
            )
          ) : (
            isLoadingFollowing ? (
              <LoadingState message="Đang tải danh sách..." />
            ) : followingData?.items && followingData.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followingData.items.map((u: UserDto) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setIsFollowListOpen(false);
                      navigate(`/users/${u.id}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <UserAvatar
                        avatarUrl={u.avatarUrl}
                        displayName={u.displayName || u.username}
                        size={36}
                        clickable={false}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          {u.displayName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          @{u.username}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Trống" description="Chưa theo dõi ai." />
            )
          )}
        </div>
      </Modal>
    </div>
  );
};
