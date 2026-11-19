import { describe, expect, it } from 'vitest';
import type { ConversationDto } from '../types';
import { canUserSendMessage } from '../utils/chatReducers';

describe('Chat Group Rules & Permissions (M3)', () => {
  const directConv: ConversationDto = {
    id: 'c-direct',
    type: 'Direct',
    members: [{ userId: 'u1', username: 'alice', displayName: 'Alice' }],
    unreadCount: 0,
    createdAt: '',
    updatedAt: '',
  };

  const groupConv: ConversationDto = {
    id: 'c-group',
    type: 'Group',
    name: 'Zalo Pro Devs',
    onlyAdminsCanSend: true,
    isDisbanded: false,
    members: [
      { userId: 'u-owner', username: 'boss', displayName: 'Boss', role: 'Owner' },
      { userId: 'u-admin', username: 'lead', displayName: 'Lead', role: 'Admin' },
      { userId: 'u-member', username: 'dev', displayName: 'Dev', role: 'Member' },
    ],
    unreadCount: 0,
    createdAt: '',
    updatedAt: '',
  };

  it('allows sending in normal direct chat', () => {
    expect(canUserSendMessage(directConv, 'u1').canSend).toBe(true);
  });

  it('restricts member from sending when onlyAdminsCanSend is enabled in group', () => {
    const res = canUserSendMessage(groupConv, 'u-member');
    expect(res.canSend).toBe(false);
    expect(res.reason).toBe('admin_only');
  });

  it('allows owner and admin to send when onlyAdminsCanSend is enabled', () => {
    expect(canUserSendMessage(groupConv, 'u-owner').canSend).toBe(true);
    expect(canUserSendMessage(groupConv, 'u-admin').canSend).toBe(true);
  });

  it('blocks all users from sending when group is disbanded', () => {
    const disbanded: ConversationDto = {
      ...groupConv,
      isDisbanded: true,
    };

    expect(canUserSendMessage(disbanded, 'u-owner').canSend).toBe(false);
    expect(canUserSendMessage(disbanded, 'u-owner').reason).toBe('disbanded');
    expect(canUserSendMessage(disbanded, 'u-member').canSend).toBe(false);
    expect(canUserSendMessage(disbanded, 'u-member').reason).toBe('disbanded');
  });
});
