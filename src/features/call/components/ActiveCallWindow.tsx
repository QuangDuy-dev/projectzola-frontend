import React, { useEffect, useRef } from 'react';
import { Maximize2, MicOff } from 'lucide-react';
import { useCall } from '../hooks/useCall';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { CallControlsBar } from './CallControlsBar';

export const ActiveCallWindow: React.FC = () => {
  const {
    callState,
    partnerInfo,
    callType,
    durationSeconds,
    isMinimized,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMinimize,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Active call shows during OUTGOING, CONNECTING, CONNECTED, ENDED
  const isActive =
    callState === 'CALLING_OUTGOING' ||
    callState === 'CONNECTING' ||
    callState === 'CONNECTED' ||
    callState === 'ENDED';

  if (!isActive) {
    return null;
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const isVideo = callType === 'Video' || isScreenSharing;

  // Minimized PiP View
  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          cursor: 'pointer',
        }}
        onClick={toggleMinimize}
      >
        <UserAvatar
          avatarUrl={partnerInfo.avatarUrl}
          displayName={partnerInfo.displayName || 'User'}
          size={36}
          clickable={false}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {partnerInfo.displayName || 'Đang gọi...'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {callState === 'CONNECTED' ? formatTimer(durationSeconds) : 'Đang kết nối...'}
          </span>
        </div>

        {isMuted && (
          <span style={{ color: '#ef4444', marginLeft: '0.25rem' }} title="Đang tắt mic">
            <MicOff size={16} />
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMinimize();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Mở rộng"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    );
  }

  // Expanded In-Call Window (Floating Modal / Full PiP)
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: isVideo ? '640px' : '360px',
        maxWidth: 'calc(100vw - 4rem)',
        height: isVideo ? '480px' : '420px',
        maxHeight: 'calc(100vh - 4rem)',
        zIndex: 99998,
        backgroundColor: '#0f172a',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        positionAnchor: 'unset',
      }}
    >
      {/* Main Video or Voice Area */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#020617',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Remote Video Stream */}
        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          /* Voice Call Avatar & Waveform Area */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div style={{ position: 'relative' }}>
              <UserAvatar
                avatarUrl={partnerInfo.avatarUrl}
                displayName={partnerInfo.displayName || 'User'}
                size={96}
                clickable={false}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '-8px',
                  borderRadius: '50%',
                  border: '2px dashed rgba(2, 132, 199, 0.6)',
                  animation: callState === 'CONNECTED' ? 'spin 12s linear infinite' : 'pulse 2s infinite',
                }}
              />
            </div>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
              {partnerInfo.displayName || 'Người dùng'}
            </h3>
            <span style={{ color: '#38bdf8', fontSize: '0.9375rem', fontWeight: 500 }}>
              {callState === 'CONNECTED'
                ? formatTimer(durationSeconds)
                : callState === 'CALLING_OUTGOING'
                ? 'Đang đổ chuông...'
                : callState === 'CONNECTING'
                ? 'Đang thiết lập kết nối...'
                : 'Đã kết thúc'}
            </span>
          </div>
        )}

        {/* Local Video Picture-in-Picture Preview (Top-Right of Video Stream) */}
        {isVideo && localStream && !isVideoOff && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '140px',
              height: '105px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backgroundColor: '#000000',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror local preview
              }}
            />
          </div>
        )}

        {/* Remote Partner Name Overlay on Video */}
        {isVideo && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              color: '#ffffff',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{partnerInfo.displayName || 'User'}</span>
            <span>•</span>
            <span style={{ color: '#38bdf8' }}>
              {callState === 'CONNECTED' ? formatTimer(durationSeconds) : 'Đang kết nối...'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Floating Controls Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.25rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
      >
        <CallControlsBar onMinimizeToggle={toggleMinimize} isMinimized={isMinimized} />
      </div>
    </div>
  );
};
