import { apiClient } from '../../../services/api/apiClient';
import type { ApiResponse } from '../../../types';

interface IceServersApiResponse {
  iceServers: RTCIceServer[];
  hasTurn: boolean;
}

function buildDefaultIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ];

  const customTurnUrls = import.meta.env.VITE_TURN_URLS as string | undefined;
  const customTurnUser = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const customTurnCred = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

  if (customTurnUrls && customTurnUser && customTurnCred) {
    servers.push({
      urls: customTurnUrls.split(',').map((u) => u.trim()).filter(Boolean),
      username: customTurnUser,
      credential: customTurnCred,
    });
  }

  return servers;
}

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: buildDefaultIceServers(),
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

/**
 * Fetches dynamic short-lived TURN/STUN credentials from Backend (/api/calls/ice-servers).
 * Falls back cleanly to default STUN servers if unconfigured or offline.
 */
export async function getDynamicRtcConfiguration(): Promise<RTCConfiguration> {
  try {
    const res = await apiClient.get<ApiResponse<IceServersApiResponse>>('/api/calls/ice-servers');
    const data = res.data?.data;
    if (data?.iceServers && data.iceServers.length > 0) {
      return {
        ...RTC_CONFIGURATION,
        iceServers: data.iceServers,
      };
    }
  } catch (err) {
    console.warn('Could not fetch dynamic ICE servers from backend, using fallback STUN:', err);
  }
  return RTC_CONFIGURATION;
}
