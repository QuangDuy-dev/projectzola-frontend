import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Minimize2, Maximize2 } from 'lucide-react';
import { useCall } from '../hooks/useCall';

export interface CallControlsBarProps {
  onMinimizeToggle?: () => void;
  isMinimized?: boolean;
}

export const CallControlsBar: React.FC<CallControlsBarProps> = ({ onMinimizeToggle, isMinimized }) => {
  const {
    isMuted,
    isVideoOff,
    isScreenSharing,
    callType,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    endCall,
  } = useCall();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: '9999px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Mic toggle */}
      <button
        type="button"
        onClick={toggleMute}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isMuted ? 'var(--color-danger, #ef4444)' : 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          transition: 'all 0.2s',
        }}
        title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {/* Camera toggle (if Video call) */}
      {callType === 'Video' && (
        <button
          type="button"
          onClick={toggleVideo}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isVideoOff ? 'var(--color-danger, #ef4444)' : 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            transition: 'all 0.2s',
          }}
          title={isVideoOff ? 'Bật Camera' : 'Tắt Camera'}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
      )}

      {/* Screen share toggle */}
      <button
        type="button"
        onClick={toggleScreenShare}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isScreenSharing ? 'var(--color-primary, #0284c7)' : 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          transition: 'all 0.2s',
        }}
        title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
      >
        <Monitor size={20} />
      </button>

      {/* Minimize / Maximize toggle */}
      {onMinimizeToggle && (
        <button
          type="button"
          onClick={onMinimizeToggle}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            transition: 'all 0.2s',
          }}
          title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
        >
          {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
        </button>
      )}

      {/* End call button */}
      <button
        type="button"
        onClick={() => endCall('UserHangup')}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-danger, #dc2626)',
          color: '#ffffff',
          transition: 'all 0.2s',
        }}
        title="Kết thúc cuộc gọi"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
};
