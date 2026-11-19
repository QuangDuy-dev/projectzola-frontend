import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../hooks/useCall';
import { UserAvatar } from '../../../components/common/UserAvatar';

export const IncomingCallDialog: React.FC = () => {
  const { callState, partnerInfo, callType, acceptCall, rejectCall } = useCall();

  if (callState !== 'RINGING_INCOMING') {
    return null;
  }

  const isVideo = callType === 'Video';

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 99999,
        minWidth: '320px',
        maxWidth: '380px',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '2px solid var(--color-primary, #0284c7)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div style={{ position: 'relative' }}>
        <UserAvatar
          avatarUrl={partnerInfo.avatarUrl}
          displayName={partnerInfo.displayName || 'Người dùng'}
          size={72}
          clickable={false}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            backgroundColor: isVideo ? '#0284c7' : '#16a34a',
            color: '#ffffff',
            borderRadius: '50%',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {isVideo ? <Video size={16} /> : <Phone size={16} />}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {partnerInfo.displayName || 'Người dùng'}
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Đang gọi {isVideo ? 'video' : 'thoại'} cho bạn...
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', width: '100%', justifyContent: 'center' }}>
        {/* Reject Button */}
        <button
          type="button"
          onClick={rejectCall}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'var(--color-danger, #ef4444)',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <PhoneOff size={18} />
          <span>Từ chối</span>
        </button>

        {/* Accept Button */}
        <button
          type="button"
          onClick={acceptCall}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'var(--color-success, #22c55e)',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {isVideo ? <Video size={18} /> : <Phone size={18} />}
          <span>Trả lời</span>
        </button>
      </div>
    </div>
  );
};
