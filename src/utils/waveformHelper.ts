/**
 * Formats seconds into MM:SS format.
 * Example: 65 -> "01:05", 5 -> "00:05"
 */
export function formatAudioDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Normalizes an array of raw amplitude numbers into floats between minVal and 1.0,
 * and downsamples/interpolates to a fixed number of bars (default max 64, max 128).
 */
export function normalizeWaveform(
  raw: number[],
  targetBars: number = 48,
  minVal: number = 0.08
): number[] {
  if (!raw || raw.length === 0) {
    return Array(targetBars).fill(minVal);
  }

  // If raw length matches target
  if (raw.length === targetBars) {
    const max = Math.max(...raw, 0.0001);
    return raw.map((v) => Math.max(minVal, Number((v / max).toFixed(2))));
  }

  // Downsample or interpolate into targetBars
  const buckets: number[] = [];
  const step = raw.length / targetBars;

  for (let i = 0; i < targetBars; i++) {
    const startIdx = Math.floor(i * step);
    const endIdx = Math.min(raw.length, Math.floor((i + 1) * step));
    let sum = 0;
    let count = 0;

    for (let j = startIdx; j < endIdx; j++) {
      sum += raw[j];
      count++;
    }

    const avg = count > 0 ? sum / count : raw[startIdx] || 0;
    buckets.push(avg);
  }

  const bucketMax = Math.max(...buckets, 0.0001);
  return buckets.map((v) => Math.max(minVal, Number((v / bucketMax).toFixed(2))));
}

/**
 * Safely parses waveform JSON string into an array of normalized numbers.
 */
export function parseWaveformJson(json?: string | null, targetBars: number = 48): number[] {
  if (!json) {
    return Array(targetBars).fill(0.15);
  }

  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return normalizeWaveform(parsed.map(Number), targetBars);
    }
  } catch {
    // If not JSON, return default wave
  }

  return Array(targetBars).fill(0.15);
}
