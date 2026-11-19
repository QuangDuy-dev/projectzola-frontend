import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ringtoneService } from '../utils/webAudioRingtone';

describe('WebAudioRingtoneManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    ringtoneService.stop();
  });

  it('can trigger playOutgoingTone without throwing in test environment', () => {
    expect(() => {
      ringtoneService.playOutgoingTone();
    }).not.toThrow();
  });

  it('can trigger playIncomingRingtone without throwing', () => {
    expect(() => {
      ringtoneService.playIncomingRingtone();
    }).not.toThrow();
  });

  it('can trigger playEndTone without throwing', () => {
    expect(() => {
      ringtoneService.playEndTone();
    }).not.toThrow();
  });

  it('safely stops audio nodes and clears intervals on stop()', () => {
    ringtoneService.playIncomingRingtone();
    expect(() => {
      ringtoneService.stop();
    }).not.toThrow();
  });
});
