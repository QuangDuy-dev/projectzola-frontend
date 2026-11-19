let currentPlayingAudio: HTMLAudioElement | null = null;
const listeners = new Set<(playingAudio: HTMLAudioElement | null) => void>();

export function registerPlayingAudio(audio: HTMLAudioElement): void {
  if (currentPlayingAudio && currentPlayingAudio !== audio) {
    try {
      currentPlayingAudio.pause();
    } catch {}
  }
  currentPlayingAudio = audio;
  listeners.forEach((fn) => fn(audio));
}

export function unregisterPlayingAudio(audio: HTMLAudioElement): void {
  if (currentPlayingAudio === audio) {
    currentPlayingAudio = null;
    listeners.forEach((fn) => fn(null));
  }
}

export function subscribeToAudioChange(fn: (playingAudio: HTMLAudioElement | null) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
