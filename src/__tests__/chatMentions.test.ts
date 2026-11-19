import { describe, expect, it } from 'vitest';
import type { ConversationMemberDto } from '../types';
import {
  getMentionQuery,
  getMentionSuggestions,
  insertMention,
} from '../utils/mentionHelper';

describe('Chat Mentions Helper (M4)', () => {
  const members: ConversationMemberDto[] = [
    { userId: 'u1', username: 'alice', displayName: 'Alice Nguyễn' },
    { userId: 'u2', username: 'bob', displayName: 'Bob Trần', nickname: 'Bobby' },
    { userId: 'u3', username: 'carol', displayName: 'Carol Lê' },
  ];

  it('detects mention query when typing @', () => {
    const q1 = getMentionQuery('Xin chào @al', 13);
    expect(q1.isMentioning).toBe(true);
    expect(q1.query).toBe('al');
    expect(q1.startIndex).toBe(9);

    const q2 = getMentionQuery('Email test@example.com', 22);
    expect(q2.isMentioning).toBe(false);
  });

  it('provides matching suggestions including @Tất cả in group', () => {
    const suggestionsGroup = getMentionSuggestions(members, 'al', true);
    expect(suggestionsGroup.some((s) => s.displayName === 'Alice Nguyễn')).toBe(true);
    expect(suggestionsGroup.some((s) => s.displayName === 'Tất cả')).toBe(true);

    const suggestionsDirect = getMentionSuggestions(members, 'al', false);
    expect(suggestionsDirect.some((s) => s.displayName === 'Tất cả')).toBe(false);
  });

  it('inserts mention correctly into text string', () => {
    const original = 'Xin chào @al bạn khỏe không?';
    const queryInfo = getMentionQuery(original, 12);
    const result = insertMention(original, queryInfo.startIndex, queryInfo.query.length, {
      id: 'u1',
      displayName: 'Alice Nguyễn',
      username: 'alice',
    });

    expect(result.newText).toBe('Xin chào @Alice Nguyễn bạn khỏe không?');
    expect(result.newCursor).toBe(23);
  });
});
