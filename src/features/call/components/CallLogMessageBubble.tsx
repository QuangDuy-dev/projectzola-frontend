import React from 'react';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video } from 'lucide-react';
import type { MessageDto, CallLogPayload } from '../../../types';
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

  let payload: Partial<CallLogPayload> = {};

  try {
    if (message.content && message.content.trim().startsWith('{')) {
      payload = JSON.parse(message.content);
    } else {
      payload = { text: message.content };
    }
  } catch {
    payload = { text: message.content };
  }

  const isCaller = Boolean(
    currentUserId &&
      (payload.callerId
        ? payload.callerId.toLowerCase() === currentUserId.toLowerCase()
        : message.senderId.toLowerCase() === currentUserId.toLowerCase())
  );

  const isVideo = payload.callType === 'Video' || payload.text?.toLowerCase().includes('video');
  const isMissed =
    payload.status === 'Missed' ||
    payload.status === 'Rejected' ||
    payload.status === 'Busy' ||
    payload.status === 'Failed' ||
    payload.text?.toLowerCase().includes('nhỡ') ||
    payload.text?.toLowerCase().includes('từ chối') ||
    payload.text?.toLowerCase().includes('bận');

  // Title generation
  let titleText = payload.text;
  if (!titleText) {
    if (isMissed) {
      titleText = isVideo ? 'Cuộc gọi video nhỡ' : 'Cuộc gọi thoại nhỡ';
    } else if (payload.durationFormatted) {
      titleText = `${isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại'} (${payload.durationFormatted})`;
    } else {
      titleText = isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại';
    }
  }

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

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <style>{`
        .call-back-btn:hover {
          background-color: rgba(2, 132, 199, 0.18) !important;
          transform: translateY(-1px);
        }
        .call-back-btn:active {
          transform: translateY(0);
        }
      `}</style>
      <div
        role="group"
        aria-label="Nhật ký cuộc gọi"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.625rem 0.875rem',
          borderRadius: '16px',
          backgroundColor: isMissed
            ? 'rgba(239, 68, 68, 0.08)'
            : isCaller
            ? 'var(--color-primary-light, #e0f2fe)'
            : 'var(--color-surface-hover, #f1f5f9)',
          border: `1px solid ${isMissed ? 'rgba(239, 68, 68, 0.25)' : 'var(--color-border, #e2e8f0)'}`,
          maxWidth: '340px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Status Icon */}
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: isMissed ? '#fee2e2' : isVideo ? '#e0f2fe' : '#dcfce7',
            color: isMissed ? '#ef4444' : isVideo ? '#0284c7' : '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isMissed ? (
            <PhoneMissed size={18} />
          ) : isVideo ? (
            <Video size={18} />
          ) : isCaller ? (
            <PhoneOutgoing size={18} />
          ) : (
            <PhoneIncoming size={18} />
          )}
        </div>

        {/* Text Details */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isMissed ? '#ef4444' : 'var(--color-text, #0f172a)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {titleText}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
            {formattedTime}
          </span>
        </div>

        {/* Quick Callback Button */}
        {otherMember?.userId && (
          <button
            type="button"
            className="call-back-btn"
            onClick={handleCallBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(2, 132, 199, 0.09)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title={isVideo ? 'Gọi lại video' : 'Gọi lại thoại'}
            aria-label={isVideo ? 'Gọi lại video' : 'Gọi lại thoại'}
          >
            {isVideo ? <Video size={14} /> : <Phone size={14} />}
            <span>Gọi lại</span>
          </button>
        )}
      </div>
    </>
  );
};
