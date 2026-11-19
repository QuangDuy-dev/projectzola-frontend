import type {
  ConversationDto,
  GroupEventDto,
  MessageDto,
  MessagePinEventDto,
  MessageReactionEventDto,
  PollUpdatedEventDto,
} from '../types';

/**
 * Updates message reactions in-place when a MessageReactionUpdated event is received.
 */
export function applyReactionUpdate(
  messages: MessageDto[],
  eventData: MessageReactionEventDto
): MessageDto[] {
  return messages.map((m) => {
    if (m.id.toLowerCase() === eventData.messageId.toLowerCase()) {
      return {
        ...m,
        reactions: eventData.reactions,
      };
    }
    return m;
  });
}

/**
 * Updates message pin status in-place when MessagePinned or MessageUnpinned is received.
 */
export function applyPinUpdate(
  messages: MessageDto[],
  eventData: MessagePinEventDto
): MessageDto[] {
  return messages.map((m) => {
    if (m.id.toLowerCase() === eventData.messageId.toLowerCase()) {
      return {
        ...m,
        isPinned: eventData.isPinned,
        pinnedById: eventData.pinnedById ?? null,
        pinnedAt: eventData.pinnedAt ?? null,
      };
    }
    return m;
  });
}

/**
 * Updates poll in-place when a PollUpdated event is received.
 */
export function applyPollUpdate(
  messages: MessageDto[],
  eventData: PollUpdatedEventDto
): MessageDto[] {
  return messages.map((m) => {
    const isTargetPoll =
      (eventData.messageId && m.id.toLowerCase() === eventData.messageId.toLowerCase()) ||
      (m.poll && m.poll.id.toLowerCase() === eventData.poll.id.toLowerCase());

    if (isTargetPoll) {
      return {
        ...m,
        poll: eventData.poll,
      };
    }
    return m;
  });
}

/**
 * Updates conversation members when a member is removed.
 */
export function applyGroupMemberRemoved(
  conversation: ConversationDto,
  eventData: GroupEventDto
): ConversationDto {
  if (eventData.conversation) {
    return eventData.conversation;
  }

  const affectedSet = new Set(eventData.affectedUserIds.map((id) => id.toLowerCase()));
  return {
    ...conversation,
    members: conversation.members.filter((m) => !affectedSet.has(m.userId.toLowerCase())),
  };
}

/**
 * Marks conversation as disbanded.
 */
export function applyGroupDisbanded(
  conversation: ConversationDto,
  _eventData?: GroupEventDto
): ConversationDto {
  return {
    ...conversation,
    isDisbanded: true,
  };
}

/**
 * Updates group settings (name, avatar, settings) from GroupUpdated event.
 */
export function applyGroupUpdated(
  conversation: ConversationDto,
  eventData: GroupEventDto
): ConversationDto {
  if (eventData.conversation) {
    return eventData.conversation;
  }
  return conversation;
}

/**
 * Checks if a user is allowed to send messages in a conversation.
 */
export function canUserSendMessage(
  conv: ConversationDto,
  userId?: string
): { canSend: boolean; reason?: 'disbanded' | 'admin_only' } {
  if (conv.isDisbanded) {
    return { canSend: false, reason: 'disbanded' };
  }

  if (conv.type === 'Group' && conv.onlyAdminsCanSend) {
    const member = conv.members.find((m) => m.userId.toLowerCase() === userId?.toLowerCase());
    const role = member?.role || conv.currentUserRole || 'Member';
    const isPrivileged = role === 'Owner' || role === 'Admin';
    if (!isPrivileged) {
      return { canSend: false, reason: 'admin_only' };
    }
  }

  return { canSend: true };
}
