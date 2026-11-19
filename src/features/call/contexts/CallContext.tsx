import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { CallIceCandidateDto, CallOfferDto, CallSessionDto, CallType } from '../../../types';
import { useAuthStore } from '../../../stores/authStore';
import { chatHubClient } from '../../../services/signalr/chatHubClient';
import { useWebRTC } from '../hooks/useWebRTC';
import { ringtoneService } from '../utils/webAudioRingtone';

export type CallLifecycleState =
  | 'IDLE'
  | 'CALLING_OUTGOING'
  | 'RINGING_INCOMING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ENDED';

export interface CallContextValue {
  callState: CallLifecycleState;
  activeSession: CallSessionDto | null;
  callType: CallType;
  durationSeconds: number;
  isMinimized: boolean;
  partnerInfo: {
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  startCall: (
    conversationId: string,
    calleeId: string,
    calleeName: string,
    calleeAvatar?: string | null,
    type?: CallType
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: (reason?: string) => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleMinimize: () => void;
  setIsMinimized: (minimized: boolean) => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useAuthStore((s) => s.user);

  const [callState, setCallState] = useState<CallLifecycleState>('IDLE');
  const [activeSession, setActiveSession] = useState<CallSessionDto | null>(null);
  const [callType, setCallType] = useState<CallType>('Voice');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
  }>({ userId: '', displayName: '' });

  const webRTC = useWebRTC();
  const timerRef = useRef<number | null>(null);
  const pendingRemoteOfferRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Stop timer and sounds on cleanup
  const resetCallState = useCallback(() => {
    ringtoneService.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    webRTC.cleanup();
    setDurationSeconds(0);
    setIsMinimized(false);
    pendingRemoteOfferRef.current = null;
  }, [webRTC]);

  const endCall = useCallback(
    async (reason = 'UserHangup') => {
      const sessionId = activeSession?.id;
      ringtoneService.playEndTone();
      resetCallState();
      setCallState('ENDED');

      if (sessionId) {
        try {
          await chatHubClient.endCall(sessionId, reason);
        } catch (e) {
          console.warn('Error ending call on server:', e);
        }
      }

      setTimeout(() => {
        setCallState('IDLE');
        setActiveSession(null);
      }, 1200);
    },
    [activeSession, resetCallState]
  );

  const rejectCall = useCallback(async () => {
    const sessionId = activeSession?.id;
    ringtoneService.stop();
    resetCallState();
    setCallState('ENDED');

    if (sessionId) {
      try {
        await chatHubClient.rejectCall(sessionId);
      } catch (e) {
        console.warn('Error rejecting call on server:', e);
      }
    }

    setTimeout(() => {
      setCallState('IDLE');
      setActiveSession(null);
    }, 1000);
  }, [activeSession, resetCallState]);

  const acceptCall = useCallback(async () => {
    if (!activeSession) return;
    ringtoneService.stop();
    setCallState('CONNECTING');

    try {
      // 1. Start local camera/mic
      await webRTC.startLocalMedia(callType);

      // 2. Initialize PeerConnection with ICE callback
      webRTC.initPeerConnection(
        (candidate) => {
          chatHubClient.sendRtcIceCandidate({
            callSessionId: activeSession.id,
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
          });
        },
        (connectionState) => {
          if (connectionState === 'connected') {
            setCallState('CONNECTED');
          } else if (connectionState === 'disconnected' || connectionState === 'failed') {
            endCall('ConnectionLost');
          }
        }
      );

      // 3. Inform server of acceptance
      await chatHubClient.acceptCall(activeSession.id);

      // 4. If remote offer is already present, create answer
      if (pendingRemoteOfferRef.current) {
        const answerSdp = await webRTC.createAnswer(pendingRemoteOfferRef.current);
        await chatHubClient.sendRtcAnswer({
          callSessionId: activeSession.id,
          sdpAnswer: answerSdp,
        });
        pendingRemoteOfferRef.current = null;
      }
    } catch (err) {
      console.error('Failed to accept call:', err);
      endCall('MediaError');
    }
  }, [activeSession, callType, webRTC, endCall]);

  const startCall = useCallback(
    async (
      conversationId: string,
      calleeId: string,
      calleeName: string,
      calleeAvatar?: string | null,
      type: CallType = 'Voice'
    ) => {
      resetCallState();
      setCallType(type);
      setPartnerInfo({
        userId: calleeId,
        displayName: calleeName,
        avatarUrl: calleeAvatar,
      });
      setCallState('CALLING_OUTGOING');
      ringtoneService.playOutgoingTone();

      try {
        // Prepare local media stream
        await webRTC.startLocalMedia(type);

        const session = await chatHubClient.startCall({
          conversationId,
          calleeId,
          type: type === 'Video' ? 1 : 0,
        });

        setActiveSession(session);

        if (session.status === 'Busy' || (session.status as unknown as number) === 5) {
          ringtoneService.stop();
          ringtoneService.playEndTone();
          setCallState('ENDED');
          setTimeout(() => {
            setCallState('IDLE');
            setActiveSession(null);
          }, 1500);
          return;
        }

        // Outgoing call timeout (45s)
        timeoutRef.current = window.setTimeout(() => {
          endCall('NoAnswerTimeout');
        }, 45000);
      } catch (err) {
        console.error('Error starting call:', err);
        resetCallState();
        setCallState('IDLE');
      }
    },
    [resetCallState, webRTC, endCall]
  );

  // Duration timer when Connected
  useEffect(() => {
    if (callState === 'CONNECTED') {
      timerRef.current = window.setInterval(() => {
        setDurationSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState]);

  // Subscribe to SignalR Call Events
  useEffect(() => {
    const unsubscribe = chatHubClient.subscribe({
      onCallRinging: (session) => {
        // If current user is callee, trigger incoming ring
        if (currentUser && session.calleeId.toLowerCase() === currentUser.id.toLowerCase()) {
          setActiveSession(session);
          const type: CallType =
            session.type === 'Video' || (session.type as unknown as number) === 1 ? 'Video' : 'Voice';
          setCallType(type);
          setPartnerInfo({
            userId: session.callerId,
            displayName: session.callerName,
            avatarUrl: session.callerAvatar,
          });
          setCallState('RINGING_INCOMING');
          ringtoneService.playIncomingRingtone();
        }
      },

      onCallAccepted: async (session) => {
        // Caller receives acceptance -> initiate WebRTC Offer
        if (currentUser && session.callerId.toLowerCase() === currentUser.id.toLowerCase()) {
          ringtoneService.stop();
          setCallState('CONNECTING');
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          try {
            webRTC.initPeerConnection(
              (candidate) => {
                chatHubClient.sendRtcIceCandidate({
                  callSessionId: session.id,
                  candidate: candidate.candidate,
                  sdpMid: candidate.sdpMid,
                  sdpMLineIndex: candidate.sdpMLineIndex,
                });
              },
              (connState) => {
                if (connState === 'connected') {
                  setCallState('CONNECTED');
                } else if (connState === 'disconnected' || connState === 'failed') {
                  endCall('ConnectionLost');
                }
              }
            );

            const offerSdp = await webRTC.createOffer();
            await chatHubClient.sendRtcOffer({
              callSessionId: session.id,
              sdpOffer: offerSdp,
            });
          } catch (err) {
            console.error('Failed to initiate RTC offer after acceptance:', err);
            endCall('WebRTCInitError');
          }
        }
      },

      onReceiveCallOffer: async (offer: CallOfferDto) => {
        // Callee receives offer from caller
        pendingRemoteOfferRef.current = offer.sdpOffer;
        // If peer connection already initialized, create and send answer
        try {
          const answerSdp = await webRTC.createAnswer(offer.sdpOffer);
          await chatHubClient.sendRtcAnswer({
            callSessionId: offer.callSessionId,
            sdpAnswer: answerSdp,
          });
        } catch {
          // May be pending acceptCall() invocation, so pendingRemoteOfferRef holds it
        }
      },

      onReceiveCallAnswer: async (answer) => {
        // Caller receives answer
        try {
          await webRTC.setRemoteAnswer(answer.sdpAnswer);
          setCallState('CONNECTED');
        } catch (e) {
          console.warn('Failed to set remote answer:', e);
        }
      },

      onReceiveIceCandidate: async (candidate: CallIceCandidateDto) => {
        await webRTC.addIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      },

      onCallBusy: () => {
        ringtoneService.stop();
        ringtoneService.playEndTone();
        setCallState('ENDED');
        setTimeout(() => {
          setCallState('IDLE');
          setActiveSession(null);
        }, 1500);
      },

      onCallRejected: () => {
        ringtoneService.stop();
        ringtoneService.playEndTone();
        setCallState('ENDED');
        setTimeout(() => {
          setCallState('IDLE');
          setActiveSession(null);
        }, 1500);
      },

      onCallEnded: () => {
        ringtoneService.stop();
        ringtoneService.playEndTone();
        setCallState('ENDED');
        setTimeout(() => {
          setCallState('IDLE');
          setActiveSession(null);
        }, 1500);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, webRTC, endCall]);

  const toggleMute = useCallback(() => {
    webRTC.toggleMute();
  }, [webRTC]);

  const toggleVideo = useCallback(() => {
    webRTC.toggleVideo();
  }, [webRTC]);

  const toggleScreenShare = useCallback(async () => {
    if (webRTC.isScreenSharing) {
      await webRTC.stopScreenShare();
    } else {
      await webRTC.startScreenShare();
    }
  }, [webRTC]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((m) => !m);
  }, []);

  const value: CallContextValue = {
    callState,
    activeSession,
    callType,
    durationSeconds,
    isMinimized,
    partnerInfo,
    localStream: webRTC.localStream,
    remoteStream: webRTC.remoteStream,
    isMuted: webRTC.isMuted,
    isVideoOff: webRTC.isVideoOff,
    isScreenSharing: webRTC.isScreenSharing,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleMinimize,
    setIsMinimized,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = (): CallContextValue => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
