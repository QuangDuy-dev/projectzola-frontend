import { describe, expect, it } from 'vitest';
import type {
  ConversationDto,
  GroupEventDto,
  MessageDto,
  MessagePinEventDto,
  MessageReactionEventDto,
  PollUpdatedEventDto,
} from '../types';
import {
  applyGroupDisbanded,
  applyGroupMemberRemoved,
  applyPinUpdate,
  applyPollUpdate,
  applyReactionUpdate,
} from '../utils/chatReducers';

describe('Chat Cache Reducers (M1)', () => {
  const baseMessage: MessageDto = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderUsername: 'alice',
    senderDisplayName: 'Alice',
    content: 'Hello World',
    isDeleted: false,
    createdAt: '2026-11-19T10:00:00Z',
    reactions: [],
  };

  it('updates reactions on reaction toggle event', () => {
    const messages = [baseMessage];
    const eventData: MessageReactionEventDto = {
      conversationId: 'conv-1',
      messageId: 'msg-1',
      userId: 'user-2',
      emoji: '👍',
      added: true,
      reactions: [
        {
          emoji: '👍',
          count: 1,
          userIds: ['user-2'],
          reactedByCurrentUser: true,
        },
      ],
    };

    const updated = applyReactionUpdate(messages, eventData);
    expect(updated[0].reactions).toHaveLength(1);
    expect(updated[0].reactions![0].emoji).toBe('👍');
    expect(updated[0].reactions![0].count).toBe(1);
    expect(updated[0].reactions![0].reactedByCurrentUser).toBe(true);
  });

  it('updates pin status on pin and unpin events', () => {
    const messages = [baseMessage];
    const pinEvent: MessagePinEventDto = {
      conversationId: 'conv-1',
      messageId: 'msg-1',
      isPinned: true,
      pinnedById: 'user-1',
      pinnedAt: '2026-11-19T10:05:00Z',
    };

    const pinned = applyPinUpdate(messages, pinEvent);
    expect(pinned[0].isPinned).toBe(true);
    expect(pinned[0].pinnedById).toBe('user-1');
    expect(pinned[0].pinnedAt).toBe('2026-11-19T10:05:00Z');

    const unpinEvent: MessagePinEventDto = {
      conversationId: 'conv-1',
      messageId: 'msg-1',
      isPinned: false,
      pinnedById: null,
      pinnedAt: null,
    };
    const unpinned = applyPinUpdate(pinned, unpinEvent);
    expect(unpinned[0].isPinned).toBe(false);
    expect(unpinned[0].pinnedById).toBeNull();
  });

  it('updates poll vote results on poll updated event', () => {
    const pollMessage: MessageDto = {
      ...baseMessage,
      id: 'msg-poll',
      type: 'Poll',
      poll: {
        id: 'poll-1',
        conversationId: 'conv-1',
        messageId: 'msg-poll',
        createdById: 'user-1',
        createdByDisplayName: 'Alice',
        question: 'Ăn trưa ở đâu?',
        allowMultipleChoices: false,
        isAnonymous: false,
        isClosed: false,
        createdAt: '2026-11-19T10:00:00Z',
        totalVotes: 0,
        totalVoters: 0,
        options: [
          { id: 'opt-1', text: 'Cơm tấm', sortOrder: 0, voteCount: 0, votedByCurrentUser: false, voterIds: [] },
          { id: 'opt-2', text: 'Bún bò', sortOrder: 1, voteCount: 0, votedByCurrentUser: false, voterIds: [] },
        ],
      },
    };

    const messages = [pollMessage];
    const eventData: PollUpdatedEventDto = {
      conversationId: 'conv-1',
      messageId: 'msg-poll',
      poll: {
        ...pollMessage.poll!,
        totalVotes: 1,
        totalVoters: 1,
        options: [
          { id: 'opt-1', text: 'Cơm tấm', sortOrder: 0, voteCount: 1, votedByCurrentUser: true, voterIds: ['user-me'] },
          { id: 'opt-2', text: 'Bún bò', sortOrder: 1, voteCount: 0, votedByCurrentUser: false, voterIds: [] },
        ],
      },
    };

    const updated = applyPollUpdate(messages, eventData);
    expect(updated[0].poll?.totalVotes).toBe(1);
    expect(updated[0].poll?.options[0].voteCount).toBe(1);
    expect(updated[0].poll?.options[0].votedByCurrentUser).toBe(true);
  });

  it('removes member from conversation on member removed event', () => {
    const conv: ConversationDto = {
      id: 'conv-group',
      type: 'Group',
      name: 'Team Dev',
      members: [
        { userId: 'u1', username: 'alice', displayName: 'Alice' },
        { userId: 'u2', username: 'bob', displayName: 'Bob' },
        { userId: 'u3', username: 'carol', displayName: 'Carol' },
      ],
      unreadCount: 0,
      createdAt: '2026-11-19T10:00:00Z',
      updatedAt: '2026-11-19T10:00:00Z',
    };

    const eventData: GroupEventDto = {
      conversationId: 'conv-group',
      eventType: 'MemberRemoved',
      actorUserId: 'u1',
      affectedUserIds: ['u2'],
      timestamp: '2026-11-19T10:10:00Z',
    };

    const updated = applyGroupMemberRemoved(conv, eventData);
    expect(updated.members).toHaveLength(2);
    expect(updated.members.map((m) => m.userId)).toEqual(['u1', 'u3']);
  });

  it('marks conversation as disbanded on group disbanded event', () => {
    const conv: ConversationDto = {
      id: 'conv-group',
      type: 'Group',
      name: 'Team Dev',
      isDisbanded: false,
      members: [
        { userId: 'u1', username: 'alice', displayName: 'Alice' },
      ],
      unreadCount: 0,
      createdAt: '2026-11-19T10:00:00Z',
      updatedAt: '2026-11-19T10:00:00Z',
    };

    const eventData: GroupEventDto = {
      conversationId: 'conv-group',
      eventType: 'GroupDisbanded',
      actorUserId: 'u1',
      affectedUserIds: [],
      timestamp: '2026-11-19T10:15:00Z',
    };

    const updated = applyGroupDisbanded(conv, eventData);
    expect(updated.isDisbanded).toBe(true);
  });
});
