import { describe, it, expect, vi } from 'vitest';
import { parseSseBuffer } from '../services/sse/sseParser';

describe('parseSseBuffer', () => {
  it('parses status event correctly', () => {
    const onStatus = vi.fn();
    const buffer = 'event: status\ndata: {"state":"thinking"}\n\n';

    const { remainingBuffer } = parseSseBuffer(buffer, { onStatus });

    expect(onStatus).toHaveBeenCalledWith('thinking');
    expect(remainingBuffer).toBe('');
  });

  it('parses sequential token events across frames', () => {
    const onToken = vi.fn();
    const buffer =
      'event: token\ndata: {"text":"Xin"}\n\nevent: token\ndata: {"text":" chào"}\n\n';

    const { remainingBuffer } = parseSseBuffer(buffer, { onToken });

    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenNthCalledWith(1, 'Xin');
    expect(onToken).toHaveBeenNthCalledWith(2, ' chào');
    expect(remainingBuffer).toBe('');
  });

  it('retains incomplete frame in remainingBuffer until completion', () => {
    const onToken = vi.fn();
    const chunk1 = 'event: token\ndata: {"text":"Hel';

    const res1 = parseSseBuffer(chunk1, { onToken });
    expect(onToken).not.toHaveBeenCalled();
    expect(res1.remainingBuffer).toBe('event: token\ndata: {"text":"Hel');

    const chunk2 = res1.remainingBuffer + 'lo"}\n\n';
    const res2 = parseSseBuffer(chunk2, { onToken });
    expect(onToken).toHaveBeenCalledWith('Hello');
    expect(res2.remainingBuffer).toBe('');
  });

  it('parses done event with metrics', () => {
    const onDone = vi.fn();
    const buffer =
      'event: done\ndata: {"category":"Shopping","durationMs":450,"totalTokens":30}\n\n';

    parseSseBuffer(buffer, { onDone });

    expect(onDone).toHaveBeenCalledWith({
      category: 'Shopping',
      durationMs: 450,
      timeToFirstTokenMs: undefined,
      totalTokens: 30,
    });
  });

  it('parses error event', () => {
    const onError = vi.fn();
    const buffer = 'event: error\ndata: {"error":"Model is currently overloaded"}\n\n';

    parseSseBuffer(buffer, { onError });

    expect(onError).toHaveBeenCalledWith('Model is currently overloaded');
  });
});
