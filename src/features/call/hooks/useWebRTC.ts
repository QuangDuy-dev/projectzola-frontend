import { useCallback, useRef, useState } from 'react';
import type { CallType } from '../../../types';
import { RTC_CONFIGURATION } from '../utils/rtcConfig';

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  startLocalMedia: (type: CallType) => Promise<MediaStream>;
  initPeerConnection: (
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  ) => RTCPeerConnection;
  createOffer: (hasVideo?: boolean) => Promise<string>;
  createAnswer: (remoteOfferSdp: string) => Promise<string>;
  setRemoteAnswer: (remoteAnswerSdp: string) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  toggleMute: () => boolean;
  toggleVideo: () => boolean;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => Promise<void>;
  cleanup: () => void;
}

export function useWebRTC(): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const queuedIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const startLocalMedia = useCallback(async (type: CallType): Promise<MediaStream> => {
    // Stop any existing stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    const hasVideo = type === 'Video';
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
        channelCount: { ideal: 1 },
        sampleRate: { ideal: 48000 },
      },
      video: hasVideo
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMuted(false);
      setIsVideoOff(!hasVideo);
      return stream;
    } catch (err) {
      console.error('Failed to get user media with full constraints:', err);
      // Fallback: try basic audio-only constraints (handles devices rejecting strict audio/video constraints)
      const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      audioOnlyStream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
      localStreamRef.current = audioOnlyStream;
      setLocalStream(audioOnlyStream);
      setIsMuted(false);
      setIsVideoOff(true);
      return audioOnlyStream;
    }
  }, []);

  const initPeerConnection = useCallback(
    (
      onIceCandidate: (candidate: RTCIceCandidate) => void,
      onConnectionStateChange?: (state: RTCPeerConnectionState) => void
    ): RTCPeerConnection => {
      if (pcRef.current) {
        pcRef.current.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIGURATION);
      pcRef.current = pc;

      // Fallback MediaStream if remote peer sends tracks without an associated stream
      const fallbackRemote = new MediaStream();

      // Handle remote tracks: prefer event.streams[0] directly so Chrome's hardware AEC
      // accurately correlates remote playout audio with the RTCPeerConnection (prevents screeching/echo)
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          return;
        }
        if (event.track && !fallbackRemote.getTracks().some((t) => t.id === event.track.id)) {
          fallbackRemote.addTrack(event.track);
        }
        setRemoteStream(new MediaStream(fallbackRemote.getTracks()));
      };

      // Handle ICE candidates generated locally
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate);
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        onConnectionStateChange?.(pc.connectionState);
      };

      // Add existing local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      return pc;
    },
    []
  );

  const createOffer = useCallback(async (hasVideo = false): Promise<string> => {
    if (!pcRef.current) throw new Error('PeerConnection not initialized');
    const offer = await pcRef.current.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: hasVideo,
    });
    await pcRef.current.setLocalDescription(offer);
    return offer.sdp || '';
  }, []);

  const createAnswer = useCallback(async (remoteOfferSdp: string): Promise<string> => {
    if (!pcRef.current) throw new Error('PeerConnection not initialized');
    await pcRef.current.setRemoteDescription(
      new RTCSessionDescription({
        type: 'offer',
        sdp: remoteOfferSdp,
      })
    );

    // Flush any ICE candidates queued before remote description was set
    while (queuedIceCandidatesRef.current.length > 0) {
      const candidate = queuedIceCandidatesRef.current.shift()!;
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => {
        console.warn('Failed to add queued ICE candidate:', e);
      });
    }

    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    return answer.sdp || '';
  }, []);

  const setRemoteAnswer = useCallback(async (remoteAnswerSdp: string): Promise<void> => {
    if (!pcRef.current) throw new Error('PeerConnection not initialized');
    await pcRef.current.setRemoteDescription(
      new RTCSessionDescription({
        type: 'answer',
        sdp: remoteAnswerSdp,
      })
    );

    // Flush queued ICE candidates
    while (queuedIceCandidatesRef.current.length > 0) {
      const candidate = queuedIceCandidatesRef.current.shift()!;
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => {
        console.warn('Failed to add queued ICE candidate:', e);
      });
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit): Promise<void> => {
    if (!pcRef.current || !pcRef.current.remoteDescription) {
      queuedIceCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('Error adding ICE candidate:', err);
    }
  }, []);

  const toggleMute = useCallback((): boolean => {
    if (!localStreamRef.current) return false;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const nextMuted = !audioTrack.enabled;
      setIsMuted(nextMuted);
      return nextMuted;
    }
    return false;
  }, []);

  const toggleVideo = useCallback((): boolean => {
    if (!localStreamRef.current) return false;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const nextVideoOff = !videoTrack.enabled;
      setIsVideoOff(nextVideoOff);
      return nextVideoOff;
    }
    return false;
  }, []);

  const startScreenShare = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      console.warn('Screen sharing not supported on this browser');
      return false;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return false;

      screenTrackRef.current = screenTrack;

      // Replace video track in peer connection
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          originalVideoTrackRef.current = videoSender.track;
          await videoSender.replaceTrack(screenTrack);
        }
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      return true;
    } catch (err) {
      console.warn('Screen sharing cancelled or failed:', err);
      return false;
    }
  }, []);

  const stopScreenShare = useCallback(async (): Promise<void> => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (pcRef.current && originalVideoTrackRef.current) {
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(originalVideoTrackRef.current);
      }
      originalVideoTrackRef.current = null;
    }

    setIsScreenSharing(false);
  }, []);

  const cleanup = useCallback((): void => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    queuedIceCandidatesRef.current = [];
  }, []);

  return {
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    startLocalMedia,
    initPeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
}
