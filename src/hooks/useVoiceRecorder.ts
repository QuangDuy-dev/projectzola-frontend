import { useState, useRef, useEffect, useCallback } from 'react';
import { normalizeWaveform } from '../utils/waveformHelper';

export interface RecordedVoiceResult {
  audioBlob: Blob;
  durationSeconds: number;
  waveformJson: string;
}

export interface UseVoiceRecorderResult {
  isRecording: boolean;
  recordingSeconds: number;
  liveWaveform: number[];
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordedVoiceResult | null>;
  cancelRecording: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const rawAmplitudesRef = useRef<number[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const sampleIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanupAudio = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (sampleIntervalRef.current) {
      clearInterval(sampleIntervalRef.current);
      sampleIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    cleanupAudio();
    recordedChunksRef.current = [];
    rawAmplitudesRef.current = [];
    setRecordingSeconds(0);
    setLiveWaveform([]);
  }, [cleanupAudio]);

  const startRecording = useCallback(async () => {
    cancelRecording();
    setError(null);
    recordedChunksRef.current = [];
    rawAmplitudesRef.current = [];
    setRecordingSeconds(0);
    setLiveWaveform([]);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ ghi âm.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize Web Audio API Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Select supported audio mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mimeType = 'audio/ogg';
          } else {
            mimeType = '';
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100); // 100ms chunks
      startTimeRef.current = Date.now();
      setIsRecording(true);

      // Timer interval: counting seconds up to 300s (5m)
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 299) {
            // Auto stop at 300 seconds
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);

      // Amplitude sampling interval (~100ms)
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      sampleIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);

        // Average frequency volume
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        rawAmplitudesRef.current.push(avg);

        // Keep last 40 live bars for visualization
        const currentLive = rawAmplitudesRef.current.slice(-40);
        const normalized = normalizeWaveform(currentLive, Math.min(40, currentLive.length));
        setLiveWaveform(normalized);
      }, 100);
    } catch (err: any) {
      console.error('Error starting voice recorder:', err);
      let msg = 'Không thể truy cập micro. Vui lòng cấp quyền trong cài đặt trình duyệt.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Bạn đã từ chối quyền truy cập micro.';
      }
      setError(msg);
      cleanupAudio();
    }
  }, [cancelRecording, cleanupAudio]);

  const stopRecording = useCallback((): Promise<RecordedVoiceResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanupAudio();
        resolve(null);
        return;
      }

      const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });

        // Downsample raw amplitudes to 48 normalized points for waveformJson
        const waveformArray = normalizeWaveform(rawAmplitudesRef.current, 48);
        const waveformJson = JSON.stringify(waveformArray);

        cleanupAudio();
        recordedChunksRef.current = [];
        rawAmplitudesRef.current = [];
        setRecordingSeconds(0);
        setLiveWaveform([]);

        resolve({
          audioBlob: blob,
          durationSeconds: duration,
          waveformJson,
        });
      };

      recorder.stop();
    });
  }, [cleanupAudio]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isRecording,
    recordingSeconds,
    liveWaveform,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
