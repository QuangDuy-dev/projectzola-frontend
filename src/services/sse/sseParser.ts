import { APP_CONFIG } from '../../app/config';
import { useAuthStore } from '../../stores/authStore';

export interface SseStreamCallbacks {
  onStatus?: (state: string) => void;
  onToken?: (text: string) => void;
  onDone?: (metrics: {
    category?: string;
    durationMs?: number;
    timeToFirstTokenMs?: number;
    totalTokens?: number;
  }) => void;
  onError?: (errorMessage: string) => void;
}

/**
 * Parses Server-Sent Events (SSE) from an incremental text buffer.
 * Dispatches complete events to callbacks.
 */
export function parseSseBuffer(
  buffer: string,
  callbacks: SseStreamCallbacks
): { remainingBuffer: string } {
  // SSE frames are separated by double newlines (\n\n or \r\n\r\n)
  let working = buffer;

  while (true) {
    const doubleNewlineIndex = working.indexOf('\n\n');
    if (doubleNewlineIndex === -1) {
      break;
    }

    const frame = working.slice(0, doubleNewlineIndex).trim();
    working = working.slice(doubleNewlineIndex + 2);

    if (!frame) continue;

    let eventType = 'message';
    let dataString = '';

    const lines = frame.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('event:')) {
        eventType = trimmed.slice(6).trim();
      } else if (trimmed.startsWith('data:')) {
        dataString = trimmed.slice(5).trim();
      }
    }

    if (!dataString) continue;

    try {
      const parsedData = JSON.parse(dataString);

      switch (eventType) {
        case 'status':
          callbacks.onStatus?.(parsedData.state || 'thinking');
          break;
        case 'token':
          if (parsedData.text) {
            callbacks.onToken?.(parsedData.text);
          }
          break;
        case 'done':
          callbacks.onDone?.({
            category: parsedData.category,
            durationMs: parsedData.durationMs,
            timeToFirstTokenMs: parsedData.timeToFirstTokenMs,
            totalTokens: parsedData.totalTokens,
          });
          break;
        case 'error':
          callbacks.onError?.(parsedData.error || 'Trợ lý AI gặp lỗi.');
          break;
        default:
          if (parsedData.text) {
            callbacks.onToken?.(parsedData.text);
          }
          break;
      }
    } catch {
      // Non-JSON plain text fallback
      if (eventType === 'token') {
        callbacks.onToken?.(dataString);
      }
    }
  }

  return { remainingBuffer: working };
}

/**
 * Authenticated POST request streaming SSE directly using fetch and ReadableStream reader.
 */
export async function streamChatbotPost(
  message: string,
  callbacks: SseStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const token = useAuthStore.getState().accessToken;
  const endpoint = `${APP_CONFIG.apiBaseUrl}/api/chatbot/chat/stream`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    'ngrok-skip-browser-warning': 'true',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
      signal,
    });
  } catch (err: any) {
    if (signal?.aborted) return;
    const errorMsg = 'Không thể kết nối đến máy chủ API. Vui lòng kiểm tra lại kết nối mạng.';
    callbacks.onError?.(errorMsg);
    throw new Error(errorMsg);
  }

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
      callbacks.onError?.('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    const errorMsg = 'Trợ lý AI hiện không khả dụng hoặc gặp lỗi từ máy chủ.';
    callbacks.onError?.(errorMsg);
    throw new Error(errorMsg);
  }

  if (!response.body) {
    callbacks.onError?.('Dữ liệu stream không phản hồi từ máy chủ.');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { remainingBuffer } = parseSseBuffer(buffer, callbacks);
      buffer = remainingBuffer;
    }

    // Process any remaining tail in buffer
    if (buffer.trim()) {
      parseSseBuffer(buffer + '\n\n', callbacks);
    }
  } catch (err: any) {
    if (signal?.aborted) return;
    callbacks.onError?.('Lỗi đường truyền dữ liệu trả lời từ AI.');
    throw err;
  } finally {
    reader.releaseLock();
  }
}
