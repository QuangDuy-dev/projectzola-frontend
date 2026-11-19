import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GripHorizontal, Maximize2, MicOff, Minimize2, Phone, Video, VideoOff } from 'lucide-react';
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

  // Window position for draggable behavior
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const isVideo = callType === 'Video' || isScreenSharing;
  const windowWidth = isVideo ? 640 : 360;
  const windowHeight = isVideo ? 480 : 440;

  // Initialize or clamp position within viewport
  const clampPosition = useCallback((x: number, y: number, w: number, h: number) => {
    if (typeof window === 'undefined') return { x, y };
    const maxX = Math.max(16, window.innerWidth - w - 16);
    const maxY = Math.max(16, window.innerHeight - h - 16);
    return {
      x: Math.min(Math.max(16, x), maxX),
      y: Math.min(Math.max(16, y), maxY),
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        return clampPosition(prev.x, prev.y, windowWidth, windowHeight);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition, windowWidth, windowHeight]);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

  // Drag handle pointer event listeners
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only primary mouse button or touch
    e.preventDefault();
    const currentPos = position || {
      x: Math.max(16, window.innerWidth - windowWidth - 32),
      y: Math.max(16, window.innerHeight - windowHeight - 32),
    };

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentPos.x,
      initialY: currentPos.y,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newPos = clampPosition(
      dragRef.current.initialX + dx,
      dragRef.current.initialY + dy,
      windowWidth,
      windowHeight
    );
    setPosition(newPos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe to ignore if pointer already released
      }
    }
  };

  // Minimized PiP View
  if (isMinimized) {
    return (
      <>
        <style>{`
          @keyframes pillFadeIn {
            from {
              opacity: 0;
              transform: translateY(12px) scale(0.92);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .minimized-call-pill {
            transition: transform 0.18s ease, box-shadow 0.18s ease;
          }
          .minimized-call-pill:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45) !important;
          }
        `}</style>
        <div
          role="region"
          aria-label="Cuộc gọi thu nhỏ"
          className="minimized-call-pill"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '0.625rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            cursor: 'pointer',
            animation: 'pillFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
          }}
          onClick={toggleMinimize}
          title="Bấm để mở rộng cuộc gọi"
        >
          <div style={{ position: 'relative' }}>
            <UserAvatar
              avatarUrl={partnerInfo.avatarUrl}
              displayName={partnerInfo.displayName || 'Người dùng'}
              size={36}
              clickable={false}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: callState === 'CONNECTED' ? '#22c55e' : '#eab308',
                border: '2px solid #0f172a',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '90px' }}>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '140px',
              }}
            >
              {partnerInfo.displayName || 'Cuộc gọi'}
            </span>
            <span style={{ fontSize: '0.75rem', color: callState === 'CONNECTED' ? '#38bdf8' : '#94a3b8' }}>
              {callState === 'CONNECTED'
                ? formatTimer(durationSeconds)
                : callState === 'CALLING_OUTGOING'
                ? 'Đang đổ chuông...'
                : 'Đang kết nối...'}
            </span>
          </div>

          {isMuted && (
            <span
              style={{
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Đang tắt mic"
            >
              <MicOff size={14} />
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            title="Mở rộng cửa sổ"
            aria-label="Mở rộng cửa sổ"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </>
    );
  }

  // Expanded Window Position
  const computedPos = position || {
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - windowWidth - 32) : 32,
    y: typeof window !== 'undefined' ? Math.max(16, window.innerHeight - windowHeight - 32) : 32,
  };

  return (
    <>
      <style>{`
        @keyframes windowFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes eqWave1 { 0%, 100% { height: 6px; } 50% { height: 26px; } }
        @keyframes eqWave2 { 0%, 100% { height: 18px; } 50% { height: 8px; } }
        @keyframes eqWave3 { 0%, 100% { height: 10px; } 50% { height: 32px; } }
        @keyframes eqWave4 { 0%, 100% { height: 24px; } 50% { height: 12px; } }
        @keyframes eqWave5 { 0%, 100% { height: 8px; } 50% { height: 22px; } }
        @keyframes voiceRipple {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
      `}</style>
      <div
        role="dialog"
        aria-label={isVideo ? 'Cửa sổ cuộc gọi video' : 'Cửa sổ cuộc gọi thoại'}
        style={{
          position: 'fixed',
          left: `${computedPos.x}px`,
          top: `${computedPos.y}px`,
          width: `${windowWidth}px`,
          maxWidth: 'calc(100vw - 32px)',
          height: `${windowHeight}px`,
          maxHeight: 'calc(100vh - 32px)',
          zIndex: 99998,
          backgroundColor: '#0f172a',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'windowFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: isDragging ? 'none' : 'auto',
          touchAction: 'none',
        }}
      >
        {/* Header Bar with Drag Handle & Actions */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            height: '46px',
            backgroundColor: isVideo ? 'rgba(15, 23, 42, 0.75)' : 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 20,
            color: '#ffffff',
            flexShrink: 0,
          }}
          title="Kéo thả để di chuyển cửa sổ"
        >
          {/* Left: Drag grip & title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none' }}>
            <GripHorizontal size={18} style={{ color: '#94a3b8' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {isVideo ? <Video size={16} color="#38bdf8" /> : <Phone size={16} color="#22c55e" />}
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>
                {isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
              </span>
            </div>
          </div>

          {/* Right: Window Controls */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking buttons
          >
            <button
              type="button"
              onClick={toggleMinimize}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease',
              }}
              title="Thu nhỏ cửa sổ"
              aria-label="Thu nhỏ cửa sổ"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* Main Content: Video or Voice Area */}
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
          {isVideo ? (
            <>
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: remoteStream ? 'block' : 'none',
                }}
              />

              {/* Connecting / Remote stream loading placeholder */}
              {!remoteStream && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    color: '#94a3b8',
                  }}
                >
                  <UserAvatar
                    avatarUrl={partnerInfo.avatarUrl}
                    displayName={partnerInfo.displayName || 'Người dùng'}
                    size={80}
                    clickable={false}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                    {callState === 'CONNECTED' ? 'Đang kết nối video...' : 'Đang chờ đối phương bắt máy...'}
                  </span>
                </div>
              )}

              {/* Remote Partner Name & Timer Overlay (Top-Left of Video) */}
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '9999px',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: callState === 'CONNECTED' ? '#22c55e' : '#eab308',
                  }}
                />
                <span style={{ fontWeight: 600 }}>{partnerInfo.displayName || 'Người dùng'}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                  {callState === 'CONNECTED' ? formatTimer(durationSeconds) : 'Đang kết nối...'}
                </span>
              </div>

              {/* Local Video Picture-in-Picture Preview (Top-Right of Video) */}
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '144px',
                  height: '108px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  border: '2px solid rgba(255, 255, 255, 0.35)',
                  backgroundColor: '#0f172a',
                  zIndex: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {localStream && !isVideoOff ? (
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
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#94a3b8',
                    }}
                  >
                    <VideoOff size={22} color="#ef4444" />
                    <span style={{ fontSize: '0.6875rem' }}>Camera tắt</span>
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    color: '#ffffff',
                    fontWeight: 500,
                  }}
                >
                  Bạn
                </div>
              </div>
            </>
          ) : (
            /* Voice Call Avatar & Equalizer Wave Area */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                zIndex: 5,
              }}
            >
              {/* Concentric ripple rings around avatar */}
              <div
                style={{
                  position: 'relative',
                  width: '108px',
                  height: '108px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {callState === 'CONNECTED' && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(2, 132, 199, 0.35)',
                        animation: 'voiceRipple 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(2, 132, 199, 0.25)',
                        animation: 'voiceRipple 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite 0.75s',
                        pointerEvents: 'none',
                      }}
                    />
                  </>
                )}

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    borderRadius: '50%',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <UserAvatar
                    avatarUrl={partnerInfo.avatarUrl}
                    displayName={partnerInfo.displayName || 'Người dùng'}
                    size={96}
                    clickable={false}
                  />
                </div>
              </div>

              {/* Partner Name & Live Status */}
              <div style={{ textAlign: 'center' }}>
                <h3
                  style={{
                    margin: '0 0 0.375rem 0',
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    maxWidth: '300px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {partnerInfo.displayName || 'Người dùng'}
                </h3>
                <span style={{ color: '#38bdf8', fontSize: '0.9375rem', fontWeight: 600 }}>
                  {callState === 'CONNECTED'
                    ? formatTimer(durationSeconds)
                    : callState === 'CALLING_OUTGOING'
                    ? 'Đang đổ chuông...'
                    : callState === 'CONNECTING'
                    ? 'Đang thiết lập kết nối...'
                    : 'Cuộc gọi đã kết thúc'}
                </span>
              </div>

              {/* Sound Wave Equalizer Effect */}
              {callState === 'CONNECTED' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '36px',
                    padding: '0 0.5rem',
                  }}
                  title="Âm thanh đang hoạt động"
                >
                  <div
                    style={{
                      width: '4px',
                      borderRadius: '2px',
                      backgroundColor: '#38bdf8',
                      animation: 'eqWave1 1.1s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      width: '4px',
                      borderRadius: '2px',
                      backgroundColor: '#38bdf8',
                      animation: 'eqWave2 0.9s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      width: '4px',
                      borderRadius: '2px',
                      backgroundColor: '#38bdf8',
                      animation: 'eqWave3 1.3s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      width: '4px',
                      borderRadius: '2px',
                      backgroundColor: '#38bdf8',
                      animation: 'eqWave4 0.95s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      width: '4px',
                      borderRadius: '2px',
                      backgroundColor: '#38bdf8',
                      animation: 'eqWave5 1.15s ease-in-out infinite',
                    }}
                  />
                </div>
              )}
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
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
          <CallControlsBar onMinimizeToggle={toggleMinimize} isMinimized={isMinimized} />
        </div>
      </div>
    </>
  );
};
