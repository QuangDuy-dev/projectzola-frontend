/**
 * Web Audio API synthesizer for Call Ringtones & Call Progress Tones.
 * Zero external audio files, zero network loading latency, no 404s.
 */
class WebAudioRingtoneManager {
  private ctx: AudioContext | null = null;
  private currentInterval: number | null = null;
  private activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private isPlaying = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Outgoing dial tone (standard pulsing beep: 425Hz 1s ON, 2s OFF).
   */
  public playOutgoingTone(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playPulse = () => {
      if (!this.isPlaying || ctx.state === 'closed') return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, ctx.currentTime);

        // Smooth envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.95);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.0);

        this.activeNodes.push({ osc, gain });
        osc.onended = () => {
          this.activeNodes = this.activeNodes.filter((n) => n.osc !== osc);
        };
      } catch {
        // Audio error fallback
      }
    };

    playPulse();
    this.currentInterval = window.setInterval(playPulse, 3000);
  }

  /**
   * Incoming ringtone (melodic repeating chime: E5, G#5, B5, E6 pattern).
   */
  public playIncomingRingtone(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playMelody = () => {
      if (!this.isPlaying || ctx.state === 'closed') return;
      const notes = [659.25, 830.61, 987.77, 1318.51, 987.77, 1318.51];
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.16);

          gain.gain.setValueAtTime(0, now + idx * 0.16);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.16 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.16);
          osc.stop(now + idx * 0.16 + 0.25);

          this.activeNodes.push({ osc, gain });
          osc.onended = () => {
            this.activeNodes = this.activeNodes.filter((n) => n.osc !== osc);
          };
        } catch {
          // ignore error
        }
      });
    };

    playMelody();
    this.currentInterval = window.setInterval(playMelody, 2600);
  }

  /**
   * Short call-ended descending chime.
   */
  public playEndTone(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.35);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);

      // Release AudioContext after chime finishes so OS audio subsystem isn't held
      const ctxToClose = ctx;
      window.setTimeout(() => {
        if (!this.isPlaying && this.ctx === ctxToClose) {
          ctxToClose.close().catch(() => {});
          this.ctx = null;
        }
      }, 500);
    } catch {
      // ignore
    }
  }

  /**
   * Stop all active sounds, intervals, and close AudioContext.
   * Closing AudioContext is critical on Android Chrome so WebRTC can enter
   * MODE_IN_COMMUNICATION with hardware Acoustic Echo Cancellation (AEC).
   */
  public stop(): void {
    this.isPlaying = false;
    if (this.currentInterval !== null) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
    this.activeNodes.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeNodes = [];

    if (this.ctx) {
      const ctxToClose = this.ctx;
      this.ctx = null;
      if (ctxToClose.state !== 'closed') {
        ctxToClose.close().catch(() => {});
      }
    }
  }
}

export const ringtoneService = new WebAudioRingtoneManager();
