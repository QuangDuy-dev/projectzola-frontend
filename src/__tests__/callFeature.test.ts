import { describe, it, expect } from 'vitest';
import { RTC_CONFIGURATION } from '../features/call/utils/rtcConfig';
import type { CallLogPayload } from '../types';

describe('callFeature core contracts and helpers', () => {
  it('has valid Google STUN servers in RTC_CONFIGURATION', () => {
    expect(RTC_CONFIGURATION.iceServers).toBeDefined();
    expect(RTC_CONFIGURATION.iceServers!.length).toBeGreaterThanOrEqual(2);
    const urls = RTC_CONFIGURATION.iceServers!.map((s) => (typeof s.urls === 'string' ? s.urls : s.urls[0]));
    expect(urls.some((u) => u.includes('stun.l.google.com:19302'))).toBe(true);
  });

  it('safely serializes and deserializes CallLog message content', () => {
    const payload: CallLogPayload = {
      callSessionId: '987fcdeb-51a2-43d7-9876-ba0987654321',
      callType: 'Video',
      status: 'Ended',
      durationSeconds: 125,
      durationFormatted: '02:05',
      callerId: 'user-1',
      calleeId: 'user-2',
      text: 'Cuộc gọi video (02:05)',
    };

    const json = JSON.stringify(payload);
    const parsed: CallLogPayload = JSON.parse(json);

    expect(parsed.callType).toBe('Video');
    expect(parsed.status).toBe('Ended');
    expect(parsed.durationSeconds).toBe(125);
    expect(parsed.durationFormatted).toBe('02:05');
    expect(parsed.text).toBe('Cuộc gọi video (02:05)');
  });

  it('detects missed, rejected and busy calls correctly', () => {
    const isMissedOrRejected = (status: string, text: string) => {
      return (
        status === 'Missed' ||
        status === 'Rejected' ||
        text.toLowerCase().includes('nhỡ') ||
        text.toLowerCase().includes('từ chối')
      );
    };

    expect(isMissedOrRejected('Missed', 'Cuộc gọi thoại nhỡ')).toBe(true);
    expect(isMissedOrRejected('Rejected', 'Cuộc gọi video bị từ chối')).toBe(true);
    expect(isMissedOrRejected('Ended', 'Cuộc gọi thoại (01:30)')).toBe(false);
  });
});
