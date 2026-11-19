import { describe, it, expect } from 'vitest';
import {
  formatAudioDuration,
  normalizeWaveform,
  parseWaveformJson,
} from '../utils/waveformHelper';

describe('chatVoice waveform and duration helper (M6)', () => {
  it('formats audio seconds into mm:ss string', () => {
    expect(formatAudioDuration(0)).toBe('00:00');
    expect(formatAudioDuration(9)).toBe('00:09');
    expect(formatAudioDuration(65)).toBe('01:05');
    expect(formatAudioDuration(300)).toBe('05:00');
    expect(formatAudioDuration(-5)).toBe('00:00');
  });

  it('normalizes empty or single value raw samples', () => {
    const emptyResult = normalizeWaveform([], 20);
    expect(emptyResult.length).toBe(20);
    expect(emptyResult.every((v) => v >= 0.08)).toBe(true);

    const singleResult = normalizeWaveform([100], 10);
    expect(singleResult.length).toBe(10);
    expect(singleResult.every((v) => v <= 1.0)).toBe(true);
  });

  it('downsamples large sample array down to targetBars', () => {
    const raw = Array.from({ length: 300 }, (_, i) => Math.sin(i / 10) * 50 + 50);
    const result = normalizeWaveform(raw, 32);
    expect(result.length).toBe(32);
    expect(Math.max(...result)).toBe(1.0);
    expect(Math.min(...result)).toBeGreaterThanOrEqual(0.08);
  });

  it('safely parses valid and invalid waveform JSON', () => {
    const validJson = JSON.stringify([0.1, 0.5, 0.9, 0.3]);
    const parsed = parseWaveformJson(validJson, 4);
    expect(parsed.length).toBe(4);
    expect(parsed[2]).toBe(1.0); // max normalized

    const invalid = parseWaveformJson('not-a-json', 16);
    expect(invalid.length).toBe(16);

    const nullValue = parseWaveformJson(null, 10);
    expect(nullValue.length).toBe(10);
  });
});
