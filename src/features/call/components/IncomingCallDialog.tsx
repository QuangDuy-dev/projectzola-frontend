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
  const callLabel = isVideo ? 'Cuộc gọi video đến...' : 'Cuộc gọi thoại đến...';
  const brandColor = isVideo ? '#0284c7' : '#16a34a';

  return (
    <>
      <style>{`
        @keyframes callRipple {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        @keyframes callPulseScale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }
        @keyframes slideInDownNotification {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div
        role="dialog"
        aria-label="Cuộc gọi đến"
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 99999,
          width: '340px',
          maxWidth: 'calc(100vw - 3rem)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          color: 'var(--color-text, #0f172a)',
          border: `1.5px solid ${brandColor}`,
          borderRadius: '20px',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0,0,0,0.05)',
          padding: '1.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          animation: 'slideInDownNotification 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Avatar with pulsing ripple rings */}
        <div
          style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer Ripple Ring 1 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: brandColor,
              animation: 'callRipple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
              pointerEvents: 'none',
            }}
          />
          {/* Outer Ripple Ring 2 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: brandColor,
              animation: 'callRipple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite 0.75s',
              pointerEvents: 'none',
            }}
          />

          {/* Central Avatar with pulse */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              borderRadius: '50%',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              animation: 'callPulseScale 1.8s ease-in-out infinite',
            }}
          >
            <UserAvatar
              avatarUrl={partnerInfo.avatarUrl}
              displayName={partnerInfo.displayName || 'Người dùng'}
              size={76}
              clickable={false}
            />

            {/* Corner Call Type Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                backgroundColor: brandColor,
                color: '#ffffff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                border: '2px solid var(--color-surface, #ffffff)',
              }}
            >
              {isVideo ? <Video size={14} /> : <Phone size={14} />}
            </div>
          </div>
        </div>

        {/* Text Info */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: brandColor,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginBottom: '0.25rem',
            }}
          >
            {isVideo ? <Video size={14} /> : <Phone size={14} />}
            {callLabel}
          </span>
          <h3
            style={{
              margin: '0.125rem 0 0 0',
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--color-text, #0f172a)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {partnerInfo.displayName || 'Người dùng'}
          </h3>
        </div>

        {/* Action Buttons: Reject (Red) & Accept (Green) */}
        <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
          {/* Reject Button */}
          <button
            type="button"
            onClick={rejectCall}
            title="Từ chối cuộc gọi"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
          >
            <PhoneOff size={18} />
            <span>Từ chối</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={acceptCall}
            title="Trả lời cuộc gọi"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: '#22c55e',
              color: '#ffffff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#16a34a';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
          >
            {isVideo ? <Video size={18} /> : <Phone size={18} />}
            <span>Trả lời</span>
          </button>
        </div>
      </div>
    </>
  );
};
