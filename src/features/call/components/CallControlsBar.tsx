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
    toggleMinimize: contextToggleMinimize,
    isMinimized: contextIsMinimized,
  } = useCall();

  const handleMinimize = onMinimizeToggle || contextToggleMinimize;
  const minimized = isMinimized !== undefined ? isMinimized : contextIsMinimized;

  const buttonStyle: React.CSSProperties = {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    flexShrink: 0,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
  };

  return (
    <>
      <style>{`
        .call-ctrl-btn {
          transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease !important;
        }
        .call-ctrl-btn:hover {
          transform: translateY(-2px) scale(1.08) !important;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35) !important;
        }
        .call-ctrl-btn:active {
          transform: translateY(0) scale(0.94) !important;
        }
      `}</style>
      <div
        role="toolbar"
        aria-label="Điều khiển cuộc gọi"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.625rem 1.125rem',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '9999px',
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Mic toggle */}
        <button
          type="button"
          className="call-ctrl-btn"
          onClick={toggleMute}
          style={{
            ...buttonStyle,
            backgroundColor: isMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.18)',
          }}
          title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
          aria-label={isMuted ? 'Bật Mic' : 'Tắt Mic'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Camera toggle (if Video call) */}
        {callType === 'Video' && (
          <button
            type="button"
            className="call-ctrl-btn"
            onClick={toggleVideo}
            style={{
              ...buttonStyle,
              backgroundColor: isVideoOff ? '#ef4444' : 'rgba(255, 255, 255, 0.18)',
            }}
            title={isVideoOff ? 'Bật Camera' : 'Tắt Camera'}
            aria-label={isVideoOff ? 'Bật Camera' : 'Tắt Camera'}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        {/* Screen share toggle */}
        <button
          type="button"
          className="call-ctrl-btn"
          onClick={toggleScreenShare}
          style={{
            ...buttonStyle,
            backgroundColor: isScreenSharing ? '#0284c7' : 'rgba(255, 255, 255, 0.18)',
          }}
          title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
          aria-label={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
        >
          <Monitor size={20} />
        </button>

        {/* Minimize / Maximize toggle */}
        {handleMinimize && (
          <button
            type="button"
            className="call-ctrl-btn"
            onClick={handleMinimize}
            style={{
              ...buttonStyle,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
            }}
            title={minimized ? 'Mở rộng cửa sổ' : 'Thu nhỏ cửa sổ'}
            aria-label={minimized ? 'Mở rộng cửa sổ' : 'Thu nhỏ cửa sổ'}
          >
            {minimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
        )}

        {/* End call button */}
        <button
          type="button"
          className="call-ctrl-btn"
          onClick={() => endCall('UserHangup')}
          style={{
            ...buttonStyle,
            backgroundColor: '#dc2626',
          }}
          title="Kết thúc cuộc gọi"
          aria-label="Kết thúc cuộc gọi"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </>
  );
};
