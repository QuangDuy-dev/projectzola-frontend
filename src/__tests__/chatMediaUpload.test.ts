import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import { chatService } from '../services/api/services';

describe('chatMedia & voice upload multipart Content-Type tests', () => {
  it('strips application/json Content-Type and applies multipart/form-data boundary for FormData payloads', async () => {
    // Spy on apiClient.post
    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(async () => {
      return {
        data: {
          success: true,
          data: {
            id: 'mock-msg-id',
            conversationId: 'mock-conv-id',
            type: 'Image',
            content: 'test',
            createdAt: new Date().toISOString(),
          },
        },
      } as any;
    });

    const file = new File(['fake-image-content'], 'test.png', { type: 'image/png' });
    await chatService.sendMediaMessage('conv-123', [file], { content: 'test photo' });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [callUrl, callData, callConfig] = postSpy.mock.calls[0];

    expect(callUrl).toBe('/api/conversations/conv-123/messages/media');
    expect(callData).toBeInstanceOf(FormData);
    expect(callConfig?.headers?.['Content-Type']).toBe('multipart/form-data');

    postSpy.mockRestore();
  });

  it('determines voice filename extension intelligently for voice recordings', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(async () => {
      return {
        data: {
          success: true,
          data: {
            id: 'mock-voice-msg-id',
            conversationId: 'mock-conv-id',
            type: 'Voice',
            createdAt: new Date().toISOString(),
          },
        },
      } as any;
    });

    // Test audio/mp4 (Safari)
    const safariBlob = new Blob(['fake-audio'], { type: 'audio/mp4' });
    await chatService.sendVoiceMessage('conv-123', safariBlob, { durationSeconds: 5 });

    const [, callDataSafari, callConfigSafari] = postSpy.mock.calls[0];
    expect(callConfigSafari?.headers?.['Content-Type']).toBe('multipart/form-data');
    const safariAudioFile = (callDataSafari as FormData).get('audio') as File;
    expect(safariAudioFile.name).toBe('voice.m4a');

    // Test audio/ogg
    const oggBlob = new Blob(['fake-ogg'], { type: 'audio/ogg' });
    await chatService.sendVoiceMessage('conv-123', oggBlob, { durationSeconds: 3 });

    const [, callDataOgg] = postSpy.mock.calls[1];
    const oggAudioFile = (callDataOgg as FormData).get('audio') as File;
    expect(oggAudioFile.name).toBe('voice.ogg');

    // Test standard audio/webm
    const webmBlob = new Blob(['fake-webm'], { type: 'audio/webm' });
    await chatService.sendVoiceMessage('conv-123', webmBlob, { durationSeconds: 8 });

    const [, callDataWebm] = postSpy.mock.calls[2];
    const webmAudioFile = (callDataWebm as FormData).get('audio') as File;
    expect(webmAudioFile.name).toBe('voice.webm');

    postSpy.mockRestore();
  });

  it('verifies apiClient request interceptor removes Content-Type when data is FormData', async () => {
    // Test the actual interceptor handlers on apiClient
    const handlers = (apiClient.interceptors.request as any).handlers;
    expect(handlers.length).toBeGreaterThan(0);

    const formData = new FormData();
    formData.append('key', 'value');

    const mockConfig: any = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: '',
      },
      data: formData,
    };

    // Run each fulfillment interceptor
    let processedConfig = mockConfig;
    for (const h of handlers) {
      if (h.fulfilled) {
        processedConfig = await h.fulfilled(processedConfig);
      }
    }

    // 'Content-Type' must be deleted so axios / browser computes the boundary
    expect(processedConfig.headers['Content-Type']).toBeUndefined();
  });
});
