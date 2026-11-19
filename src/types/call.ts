export type CallType = 'Voice' | 'Video';

export type CallStatus =
  | 'Initiating'
  | 'Ringing'
  | 'Connected'
  | 'Rejected'
  | 'Missed'
  | 'Busy'
  | 'Ended';

export interface CallSessionDto {
  id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string | null;
  calleeId: string;
  calleeName: string;
  calleeAvatar?: string | null;
  type: CallType | number | string;
  status: CallStatus | number | string;
  createdAt: string;
  connectedAt?: string | null;
  endedAt?: string | null;
  durationSeconds: number;
}

export interface StartCallRequest {
  conversationId: string;
  calleeId: string;
  type: CallType | number;
}

export interface CallOfferDto {
  callSessionId: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string | null;
  callType: CallType | number | string;
  sdpOffer: string;
}

export interface SendRtcOfferRequest {
  callSessionId: string;
  sdpOffer: string;
}

export interface CallAnswerDto {
  callSessionId: string;
  calleeId: string;
  sdpAnswer: string;
}

export interface SendRtcAnswerRequest {
  callSessionId: string;
  sdpAnswer: string;
}

export interface CallIceCandidateDto {
  callSessionId: string;
  senderId: string;
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

export interface SendRtcIceCandidateRequest {
  callSessionId: string;
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

export interface CallEndedDto {
  callSessionId: string;
  conversationId: string;
  status: CallStatus | string;
  reason: string;
  durationSeconds: number;
  endedByUserId: string;
}

export interface CallLogPayload {
  callSessionId: string;
  callType: 'Voice' | 'Video' | string;
  status: CallStatus | string;
  durationSeconds: number;
  durationFormatted: string;
  callerId: string;
  calleeId: string;
  text: string;
  reason?: string;
}
