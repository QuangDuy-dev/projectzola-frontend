import { describe, expect, it } from 'vitest';
import type { OnlineFriendDto, UserPresenceDto } from '../types';

function buildPresenceLookup(
  initialFriends: OnlineFriendDto[],
  realtimeEvents: UserPresenceDto[]
) {
  const presenceMap = new Map<string, { isOnline: boolean; lastSeenAt?: string | null }>();

  for (const f of initialFriends) {
    presenceMap.set(f.userId.toLowerCase(), {
      isOnline: f.isOnline,
      lastSeenAt: f.lastSeenAt,
    });
  }

  for (const ev of realtimeEvents) {
    presenceMap.set(ev.userId.toLowerCase(), {
      isOnline: ev.isOnline,
      lastSeenAt: ev.timestamp,
    });
  }

  return {
    isOnline: (userId?: string) => {
      if (!userId) return false;
      return presenceMap.get(userId.toLowerCase())?.isOnline ?? false;
    },
    getLastSeen: (userId?: string) => {
      if (!userId) return null;
      return presenceMap.get(userId.toLowerCase())?.lastSeenAt ?? null;
    },
  };
}

describe('Chat Presence (M2)', () => {
  const initialFriends: OnlineFriendDto[] = [
    {
      userId: 'u-1',
      username: 'alice',
      displayName: 'Alice',
      isOnline: true,
      lastSeenAt: '2026-11-19T10:00:00Z',
      relationship: 'MutualFollow',
    },
    {
      userId: 'u-2',
      username: 'bob',
      displayName: 'Bob',
      isOnline: false,
      lastSeenAt: '2026-11-19T09:30:00Z',
      relationship: 'DirectContact',
    },
  ];

  it('correctly reports online status from initial list', () => {
    const presence = buildPresenceLookup(initialFriends, []);
    expect(presence.isOnline('u-1')).toBe(true);
    expect(presence.isOnline('u-2')).toBe(false);
    expect(presence.isOnline('u-unknown')).toBe(false);
  });

  it('updates online status in realtime when UserPresenceChanged event arrives', () => {
    const events: UserPresenceDto[] = [
      {
        userId: 'u-2',
        isOnline: true,
        timestamp: '2026-11-19T10:05:00Z',
      },
      {
        userId: 'u-1',
        isOnline: false,
        timestamp: '2026-11-19T10:06:00Z',
      },
    ];

    const presence = buildPresenceLookup(initialFriends, events);
    expect(presence.isOnline('u-1')).toBe(false);
    expect(presence.getLastSeen('u-1')).toBe('2026-11-19T10:06:00Z');
    expect(presence.isOnline('u-2')).toBe(true);
  });
});
