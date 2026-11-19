import React, { useEffect, useRef } from 'react';
import { IncomingCallDialog } from './IncomingCallDialog';
import { ActiveCallWindow } from './ActiveCallWindow';
import { useCall } from '../hooks/useCall';

export const CallOverlayRoot: React.FC = () => {
  const { remoteStream, callState } = useCall();
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;

    if (remoteStream && callState !== 'IDLE') {
      if (audioEl.srcObject !== remoteStream) {
        audioEl.srcObject = remoteStream;
      }
      audioEl.volume = 0.85;
      audioEl.muted = false;
      audioEl.play().catch((err) => {
        console.warn('Remote audio autoplay blocked; waiting for user gesture:', err);
        const resumeOnGesture = () => {
          audioEl.play().catch(() => {});
          window.removeEventListener('click', resumeOnGesture);
          window.removeEventListener('touchstart', resumeOnGesture);
        };
        window.addEventListener('click', resumeOnGesture, { once: true });
        window.addEventListener('touchstart', resumeOnGesture, { once: true });
      });
    } else {
      audioEl.pause();
      audioEl.srcObject = null;
    }
  }, [remoteStream, callState]);

  return (
    <>
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
        data-testid="remote-call-audio"
      />
      <IncomingCallDialog />
      <ActiveCallWindow />
    </>
  );
};
