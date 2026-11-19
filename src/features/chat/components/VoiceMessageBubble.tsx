import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { useMediaBlobUrl } from '../../../utils/mediaBlob';
import { formatAudioDuration, parseWaveformJson } from '../../../utils/waveformHelper';
import {
  registerPlayingAudio,
  unregisterPlayingAudio,
  subscribeToAudioChange,
} from '../../../utils/audioPlayerManager';
import type { MessageAttachmentDto } from '../../../types';

interface VoiceMessageBubbleProps {
  attachment?: MessageAttachmentDto;
  isMine?: boolean;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  attachment,
  isMine,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment?.durationSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformBars = parseWaveformJson(attachment?.waveformJson, 36);

  const resolvedAudioUrl = resolveMediaUrl(attachment?.storageUrl);
  const { blobUrl: audioBlobUrl } = useMediaBlobUrl(resolvedAudioUrl);

  useEffect(() => {
    const unsub = subscribeToAudioChange((playingAudio) => {
      if (playingAudio !== audioRef.current && isPlaying) {
        setIsPlaying(false);
      }
    });
    return unsub;
  }, [isPlaying]);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      unregisterPlayingAudio(audio);
    } else {
      registerPlayingAudio(audio);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio play error:', err));
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      unregisterPlayingAudio(audioRef.current);
    }
  };

  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const targetTime = (index / waveformBars.length) * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed: 1 | 1.5 | 2 = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeBarsCount = Math.round((progressPercent / 100) * waveformBars.length);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.25rem 0',
        minWidth: '220px',
        maxWidth: '300px',
      }}
    >
      {audioBlobUrl && (
        <audio
          ref={audioRef}
          src={audioBlobUrl}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={handleTogglePlay}
        disabled={!resolvedAudioUrl}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: isMine ? '#ffffff' : 'var(--color-primary)',
          color: isMine ? 'var(--color-primary)' : '#ffffff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          transition: 'transform 0.1s ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

      {/* Waveform Scrubber Bars */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            height: '24px',
          }}
        >
          {waveformBars.map((val, idx) => {
            const isPlayed = idx < activeBarsCount;
            return (
              <div
                key={idx}
                onClick={() => handleSeek(idx)}
                style={{
                  flex: 1,
                  height: `${Math.max(15, val * 100)}%`,
                  borderRadius: '2px',
                  backgroundColor: isMine
                    ? isPlayed
                      ? '#ffffff'
                      : 'rgba(255, 255, 255, 0.45)'
                    : isPlayed
                      ? 'var(--color-primary)'
                      : 'var(--color-border)',
                  transition: 'background-color 0.15s ease',
                }}
              />
            );
          })}
        </div>

        {/* Time and Speed Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.6875rem',
            color: isMine ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted)',
            fontWeight: 500,
          }}
        >
          <span>{isPlaying ? formatAudioDuration(currentTime) : formatAudioDuration(duration)}</span>

          <button
            type="button"
            onClick={cycleSpeed}
            style={{
              background: isMine ? 'rgba(255, 255, 255, 0.25)' : 'var(--color-surface-hover)',
              color: isMine ? '#ffffff' : 'var(--color-text)',
              border: 'none',
              borderRadius: '4px',
              padding: '1px 4px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Đổi tốc độ phát"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
};
