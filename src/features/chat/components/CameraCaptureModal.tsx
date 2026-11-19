import { useEffect, useState } from 'react';
import { Camera, Video, Square, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCameraCapture } from '../../../hooks/useCameraCapture';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    videoRef,
    isCameraActive,
    isRecording,
    recordingSeconds,
    error,
    startCamera,
    stopCamera,
    takePhoto,
    startRecording,
    stopRecording,
  } = useCameraCapture();

  useEffect(() => {
    if (isOpen) {
      setPreviewFile(null);
      setPreviewUrl(null);
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [previewFile]);

  if (!isOpen) return null;

  const handleTakePhoto = async () => {
    const file = await takePhoto();
    if (file) {
      setPreviewFile(file);
      stopCamera();
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      const file = await stopRecording();
      if (file) {
        setPreviewFile(file);
        stopCamera();
      }
    } else {
      startRecording();
    }
  };

  const handleRetake = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (previewFile) {
      onCapture(previewFile);
      onClose();
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#111827',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #374151',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1f2937',
            color: '#f9fafb',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!previewFile && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('photo')}
                  disabled={isRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: mode === 'photo' ? 'var(--color-primary)' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={16} />
                  <span>Chụp ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('video')}
                  disabled={isRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: mode === 'video' ? 'var(--color-primary)' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Video size={16} />
                  <span>Quay video (≤60s)</span>
                </button>
              </>
            )}
            {previewFile && (
              <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                Xem trước {previewFile.type.startsWith('video') ? 'video' : 'ảnh chụp'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport / Preview */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {error && (
            <div
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                color: '#f87171',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <AlertCircle size={36} />
              <p style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>{error}</p>
            </div>
          )}

          {!error && !previewFile && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror effect for selfie camera
              }}
            />
          )}

          {previewFile && previewUrl && (
            previewFile.type.startsWith('video') ? (
              <video
                src={previewUrl}
                controls
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <img
                src={previewUrl}
                alt="Chụp ảnh"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            )
          )}

          {/* Video recording indicator */}
          {isRecording && (
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(239, 68, 68, 0.85)',
                color: '#ffffff',
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  animation: 'pulse 1s infinite',
                }}
              />
              <span>REC {formatTimer(recordingSeconds)} / 01:00</span>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div
          style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            borderTop: '1px solid #1f2937',
          }}
        >
          {previewFile ? (
            <>
              <Button variant="outline" onClick={handleRetake} style={{ color: '#ffffff', borderColor: '#4b5563' }}>
                <RefreshCw size={16} />
                <span>Chụp lại</span>
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                <Check size={16} />
                <span>Sử dụng</span>
              </Button>
            </>
          ) : (
            <>
              {mode === 'photo' ? (
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  disabled={!isCameraActive || !!error}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '4px solid var(--color-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.4)',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Camera size={26} color="var(--color-primary)" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={!isCameraActive || !!error}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: isRecording ? 'var(--radius-lg)' : '50%',
                    backgroundColor: '#ef4444',
                    border: '4px solid #ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isRecording ? <Square size={24} color="#ffffff" fill="#ffffff" /> : <Video size={26} color="#ffffff" />}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
