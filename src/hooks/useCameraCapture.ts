import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseCameraCaptureResult {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  takePhoto: () => Promise<File | null>;
  startRecording: () => void;
  stopRecording: () => Promise<File | null>;
}

export function useCameraCapture(): UseCameraCaptureResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
    setIsRecording(false);
    setRecordingSeconds(0);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt của bạn không hỗ trợ truy cập máy ảnh hoặc micro.');
      }

      let userStream: MediaStream;
      try {
        userStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (err: any) {
        // Fallback to video only if audio is unavailable or denied
        userStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      }

      streamRef.current = userStream;
      setStream(userStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Không thể truy cập máy ảnh hoặc micro. Vui lòng cấp quyền trong cài đặt trình duyệt.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Bạn đã từ chối quyền truy cập máy ảnh/micro. Hãy bật quyền này trong trình duyệt để tiếp tục.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Không tìm thấy thiết bị máy ảnh hoặc micro trên máy tính của bạn.';
      }
      setError(msg);
      setIsCameraActive(false);
    }
  }, [stopCamera]);

  const takePhoto = useCallback(async (): Promise<File | null> => {
    const video = videoRef.current;
    if (!video || !streamRef.current) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.92);
    });
  }, []);

  const stopRecording = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsRecording(false);

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `video_${Date.now()}.${ext}`, { type: mimeType });
        recordedChunksRef.current = [];
        resolve(file);
      };

      recorder.stop();
    });
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    let mimeType = 'video/webm;codecs=vp8,opus';
    if (typeof MediaRecorder !== 'undefined') {
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : '';
      }
    }

    try {
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(streamRef.current, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500); // 500ms slices
      setIsRecording(true);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            // Auto stop at 60s
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error starting MediaRecorder', err);
      setError('Không thể bắt đầu quay video: ' + (err.message || 'Lỗi không xác định'));
    }
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    stream,
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
  };
}
