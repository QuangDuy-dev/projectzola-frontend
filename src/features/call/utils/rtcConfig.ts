function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    // Google public STUN servers (fast direct P2P on same WiFi / normal NAT)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
  ];

  // Optional custom TURN server from environment variables (recommended for production)
  const customTurnUrls = import.meta.env.VITE_TURN_URLS as string | undefined;
  const customTurnUser = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const customTurnCred = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

  if (customTurnUrls && customTurnUser && customTurnCred) {
    servers.push({
      urls: customTurnUrls.split(',').map((u) => u.trim()).filter(Boolean),
      username: customTurnUser,
      credential: customTurnCred,
    });
  } else {
    // Free OpenRelay TURN servers by Metered (punches through 4G/5G Symmetric NAT & strict firewalls)
    servers.push(
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp',
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: [
          'turn:standard.relay.metered.ca:80',
          'turn:standard.relay.metered.ca:80?transport=tcp',
          'turn:standard.relay.metered.ca:443',
          'turns:standard.relay.metered.ca:443?transport=tcp',
        ],
        username: 'e8dd65b92f6dde62d4b0f6c5',
        credential: 'uWdWNmkhvyqTEAcO',
      }
    );
  }

  return servers;
}

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: buildIceServers(),
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};
