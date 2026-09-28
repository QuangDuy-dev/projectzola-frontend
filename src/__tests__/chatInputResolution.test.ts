import { describe, it, expect } from 'vitest';

export function resolveChatTarget(
  rawInput: string,
  currentUserId: string,
  currentUsername: string,
  knownUsers: Array<{ username: string; id: string }>
): { type: 'guid' | 'username'; value: string; isSelf: boolean } {
  const trimmed = rawInput.trim();
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

  if (isGuid) {
    const isSelf = trimmed.toLowerCase() === currentUserId.toLowerCase();
    return { type: 'guid', value: trimmed, isSelf };
  }

  const cleanUsername = trimmed.replace(/^@/, '').trim().toLowerCase();
  const isSelf = cleanUsername === currentUsername.toLowerCase();
  const matched = knownUsers.find((u) => u.username.toLowerCase() === cleanUsername);

  return {
    type: 'username',
    value: matched ? matched.id : cleanUsername,
    isSelf,
  };
}

describe('Chat Target Input Resolution', () => {
  const currentUserId = 'd00476d1-378e-4776-94ec-6f9f753a817c';
  const currentUsername = 'user1';
  const knownUsers = [
    { username: 'shopowner1', id: '5c800801-3f2d-4c03-9e4d-8d37fe7da4db' },
    { username: 'admin', id: '35ccfee2-b164-48ed-ba78-6fcdec7914d2' },
    { username: 'user1', id: 'd00476d1-378e-4776-94ec-6f9f753a817c' },
  ];

  it('correctly handles @username and resolves to user ID if known', () => {
    const res = resolveChatTarget('@shopowner1', currentUserId, currentUsername, knownUsers);
    expect(res.type).toBe('username');
    expect(res.value).toBe('5c800801-3f2d-4c03-9e4d-8d37fe7da4db');
    expect(res.isSelf).toBe(false);
  });

  it('correctly handles plain username without @ and resolves to user ID', () => {
    const res = resolveChatTarget('shopowner1', currentUserId, currentUsername, knownUsers);
    expect(res.type).toBe('username');
    expect(res.value).toBe('5c800801-3f2d-4c03-9e4d-8d37fe7da4db');
    expect(res.isSelf).toBe(false);
  });

  it('detects self-chat attempts via username or @username', () => {
    const res1 = resolveChatTarget('@user1', currentUserId, currentUsername, knownUsers);
    expect(res1.isSelf).toBe(true);

    const res2 = resolveChatTarget('user1', currentUserId, currentUsername, knownUsers);
    expect(res2.isSelf).toBe(true);
  });

  it('detects self-chat attempts via GUID', () => {
    const res = resolveChatTarget(currentUserId, currentUserId, currentUsername, knownUsers);
    expect(res.type).toBe('guid');
    expect(res.isSelf).toBe(true);
  });

  it('passes through raw GUID for other users', () => {
    const guid = '5c800801-3f2d-4c03-9e4d-8d37fe7da4db';
    const res = resolveChatTarget(guid, currentUserId, currentUsername, knownUsers);
    expect(res.type).toBe('guid');
    expect(res.value).toBe(guid);
    expect(res.isSelf).toBe(false);
  });
});
