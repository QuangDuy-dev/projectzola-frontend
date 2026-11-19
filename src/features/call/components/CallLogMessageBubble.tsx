import React from 'react';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video } from 'lucide-react';
import type { MessageDto } from '../../../types';
import { useAuthStore } from '../../../stores/authStore';
import { useCall } from '../hooks/useCall';

export interface CallLogMessageBubbleProps {
  message: MessageDto;
  otherMember?: {
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
}

export const CallLogMessageBubble: React.FC<CallLogMessageBubbleProps> = ({ message, otherMember }) => {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { startCall } = useCall();

  let payload: {
    callSessionId?: string;
    callType?: string;
    status?: string;
    durationFormatted?: string;
    callerId?: string;
    text?: string;
  } = {};

  try {
    if (message.content.startsWith('{')) {
      payload = JSON.parse(message.content);
    } else {
      payload = { text: message.content };
    }
  } catch {
    payload = { text: message.content };
  }

  const isCaller = message.senderId.toLowerCase() === currentUserId?.toLowerCase();
  const isVideo = payload.callType === 'Video';
  const isMissed =
    payload.status === 'Missed' ||
    payload.status === 'Rejected' ||
    payload.text?.toLowerCase().includes('nhỡ') ||
    payload.text?.toLowerCase().includes('từ chối');

  const displayText = payload.text || (isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại');

  const handleCallBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (otherMember?.userId) {
      startCall(
        message.conversationId,
        otherMember.userId,
        otherMember.displayName,
        otherMember.avatarUrl,
        isVideo ? 'Video' : 'Voice'
      );
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 1rem',
        borderRadius: '16px',
        backgroundColor: isCaller ? 'var(--color-primary-light, #e0f2fe)' : 'var(--color-surface-hover, #f1f5f9)',
        border: '1px solid var(--color-border, #e2e8f0)',
        maxWidth: '320px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: isMissed ? '#fee2e2' : '#dcfce7',
          color: isMissed ? '#ef4444' : '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isVideo ? (
          <Video size={18} />
        ) : isMissed ? (
          <PhoneMissed size={18} />
        ) : isCaller ? (
          <PhoneOutgoing size={18} />
        ) : (
          <PhoneIncoming size={18} />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: isMissed ? 'var(--color-danger, #ef4444)' : 'var(--color-text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayText}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {otherMember?.userId && (
        <button
          type="button"
          onClick={handleCallBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary, #0284c7)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(2, 132, 199, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          title="Gọi lại"
        >
          {isVideo ? <Video size={14} /> : <Phone size={14} />}
          <span>Gọi lại</span>
        </button>
      )}
    </div>
  );
};
