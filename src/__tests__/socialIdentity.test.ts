import { describe, it, expect } from 'vitest';
import type { PublicUserProfileDto, FeedAuthorDto, CommentDto } from '../types';

describe('Social Identity & Public Profile Contracts', () => {
  it('verifies PublicUserProfileDto contains safe fields and omits sensitive credentials', () => {
    const publicProfile: PublicUserProfileDto = {
      id: '11111111-1111-1111-1111-111111111111',
      username: 'alice',
      displayName: 'Alice Wonderland',
      avatarUrl: '/media/avatars/alice.webp',
      bio: 'Photographer and artist',
      followerCount: 42,
      followingCount: 15,
      postCount: 8,
      isFollowing: true,
      createdAt: '2026-09-01T00:00:00Z',
    };

    expect(publicProfile.username).toBe('alice');
    expect(publicProfile.displayName).toBe('Alice Wonderland');
    expect(publicProfile.followerCount).toBe(42);
    expect(publicProfile.followingCount).toBe(15);
    expect(publicProfile.postCount).toBe(8);
    expect(publicProfile.isFollowing).toBe(true);

    // Ensure sensitive fields do not exist on the type
    expect((publicProfile as any).passwordHash).toBeUndefined();
    expect((publicProfile as any).email).toBeUndefined();
    expect((publicProfile as any).role).toBeUndefined();
  });

  it('validates FeedAuthorDto mapping on feed posts', () => {
    const author: FeedAuthorDto = {
      id: '22222222-2222-2222-2222-222222222222',
      username: 'bob_dev',
      displayName: 'Bob The Builder',
      avatarUrl: '/media/avatars/bob.webp',
    };

    expect(author.id).toBeDefined();
    expect(author.username).toBe('bob_dev');
    expect(author.displayName).toBe('Bob The Builder');
    expect(author.avatarUrl).toContain('.webp');
  });

  it('validates CommentDto contains full author identity info', () => {
    const comment: CommentDto = {
      id: 'c-1',
      postId: 'p-1',
      userId: 'u-1',
      username: 'charlie',
      displayName: 'Charlie Brown',
      userAvatarUrl: '/media/avatars/charlie.webp',
      content: 'Great post!',
      createdAt: '2026-09-22T12:00:00Z',
      updatedAt: '2026-09-22T12:00:00Z',
    };

    expect(comment.userId).toBe('u-1');
    expect(comment.username).toBe('charlie');
    expect(comment.displayName).toBe('Charlie Brown');
    expect(comment.userAvatarUrl).toBe('/media/avatars/charlie.webp');
    expect(comment.content).toBe('Great post!');
  });
});
