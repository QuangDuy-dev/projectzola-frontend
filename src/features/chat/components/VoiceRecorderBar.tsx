import { Trash2, Send, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { formatAudioDuration } from '../../../utils/waveformHelper';

interface VoiceRecorderBarProps {
  recordingSeconds: number;
  liveWaveform: number[];
  error?: string | null;
  onCancel: () => void;
  onSend: () => void;
  isSending?: boolean;
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  recordingSeconds,
  liveWaveform,
  error,
  onCancel,
  onSend,
  isSending,
}) => {
  if (error) {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-error-light, #fee2e2)',
          color: 'var(--color-error, #dc2626)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Đóng
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        disabled={isSending}
        title="Hủy ghi âm"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-error, #dc2626)',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Trash2 size={20} />
      </button>

      {/* Pulsing red dot + Recording Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'inline-block',
            boxShadow: '0 0 8px #ef4444',
          }}
        />
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--color-text)',
          }}
        >
          {formatAudioDuration(recordingSeconds)} / 05:00
        </span>
      </div>

      {/* Live Waveform Visualization Bars */}
      <div
        style={{
          flex: 1,
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          overflow: 'hidden',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-md)',
          padding: '0 0.5rem',
        }}
      >
        {liveWaveform.length === 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Đang lắng nghe âm thanh...
          </span>
        )}
        {liveWaveform.map((val, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: `${Math.max(12, val * 100)}%`,
              backgroundColor: 'var(--color-primary)',
              borderRadius: '2px',
              transition: 'height 0.1s ease',
            }}
          />
        ))}
      </div>

      {/* Send / Stop Recording Button */}
      <Button
        type="button"
        variant="primary"
        onClick={onSend}
        isLoading={isSending}
        disabled={isSending}
        style={{
          borderRadius: 'var(--radius-full)',
          width: '40px',
          height: '40px',
          padding: 0,
        }}
        title="Gửi tin nhắn thoại"
      >
        <Send size={18} />
      </Button>
    </div>
  );
};
