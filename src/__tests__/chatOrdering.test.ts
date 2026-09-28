import { describe, it, expect } from 'vitest';
import type { MessageDto } from '../types';

// Pure helper functions mirroring the logic in useChat
function normalizeInitialMessages(serverItems: MessageDto[]): MessageDto[] {
  // Server returns newest first; reverse to chronological order [oldest, ..., newest]
  return [...serverItems].reverse();
}

function appendNewMessage(currentItems: MessageDto[], newMsg: MessageDto): MessageDto[] {
  const exists = currentItems.some((m) => m.id === newMsg.id);
  if (exists) return currentItems;
  return [...currentItems, newMsg];
}

function prependOlderMessages(currentItems: MessageDto[], olderServerItems: MessageDto[]): MessageDto[] {
  const olderChronological = [...olderServerItems].reverse();
  const existingIds = new Set(currentItems.map((m) => m.id));
  const filteredOlder = olderChronological.filter((m) => !existingIds.has(m.id));
  return [...filteredOlder, ...currentItems];
}

function updateMessageInPlace(currentItems: MessageDto[], updated: MessageDto): MessageDto[] {
  return currentItems.map((m) => (m.id === updated.id ? updated : m));
}

function deleteMessageInPlace(currentItems: MessageDto[], deletedMessageId: string): MessageDto[] {
  return currentItems.map((m) =>
    m.id === deletedMessageId ? { ...m, isDeleted: true, content: 'Tin nhắn đã bị thu hồi' } : m
  );
}

describe('Chat Message Chronological Ordering & Management', () => {
  const createMockMsg = (id: string, content: string, createdAt: string): MessageDto => ({
    id,
    conversationId: 'c1',
    senderId: 'u1',
    senderUsername: 'alice',
    senderDisplayName: 'Alice',
    content,
    isDeleted: false,
    createdAt,
  });

  const msg1 = createMockMsg('m1', 'Hello 1', '2026-09-22T10:00:00Z');
  const msg2 = createMockMsg('m2', 'Hello 2', '2026-09-22T10:01:00Z');
  const msg3 = createMockMsg('m3', 'Hello 3', '2026-09-22T10:02:00Z');
  const msg4 = createMockMsg('m4', 'Hello 4', '2026-09-22T10:03:00Z');

  it('normalizes server descending messages into chronological order (oldest to newest)', () => {
    // Backend returns newest first: [msg3, msg2, msg1]
    const serverDescending = [msg3, msg2, msg1];
    const normalized = normalizeInitialMessages(serverDescending);

    expect(normalized).toHaveLength(3);
    expect(normalized[0].id).toBe('m1'); // Oldest at top
    expect(normalized[1].id).toBe('m2');
    expect(normalized[2].id).toBe('m3'); // Newest at bottom
  });

  it('appends outgoing and realtime incoming messages to the bottom', () => {
    const initial = [msg1, msg2, msg3];
    const updated = appendNewMessage(initial, msg4);

    expect(updated).toHaveLength(4);
    expect(updated[3].id).toBe('m4');
    expect(updated[0].id).toBe('m1');
  });

  it('deduplicates incoming messages by ID when appended', () => {
    const initial = [msg1, msg2, msg3];
    const duplicate = appendNewMessage(initial, msg3);

    expect(duplicate).toHaveLength(3);
    expect(duplicate).toEqual(initial);
  });

  it('prepends older historical messages to the top while preserving chronological order', () => {
    const current = [msg3, msg4];
    // Older messages from page 2 from backend (newest first of the older batch): [msg2, msg1]
    const olderFromServer = [msg2, msg1];
    const prepended = prependOlderMessages(current, olderFromServer);

    expect(prepended).toHaveLength(4);
    expect(prepended.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']);
  });

  it('updates messages in place without altering list order', () => {
    const initial = [msg1, msg2, msg3];
    const editedMsg2 = { ...msg2, content: 'Hello 2 edited' };
    const result = updateMessageInPlace(initial, editedMsg2);

    expect(result).toHaveLength(3);
    expect(result[1].id).toBe('m2');
    expect(result[1].content).toBe('Hello 2 edited');
    expect(result[0].id).toBe('m1');
    expect(result[2].id).toBe('m3');
  });

  it('deletes message in place and updates content to revoked notice', () => {
    const initial = [msg1, msg2, msg3];
    const result = deleteMessageInPlace(initial, 'm2');

    expect(result).toHaveLength(3);
    expect(result[1].id).toBe('m2');
    expect(result[1].isDeleted).toBe(true);
    expect(result[1].content).toBe('Tin nhắn đã bị thu hồi');
  });
});
