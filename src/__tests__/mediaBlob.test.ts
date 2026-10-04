import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isNgrokUrl, fetchMediaBlobUrl } from '../utils/mediaBlob';

describe('mediaBlob utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isNgrokUrl', () => {
    it('returns true for ngrok domains', () => {
      expect(isNgrokUrl('https://provincially-dialytic-stefany.ngrok-free.dev/media/test.webp')).toBe(true);
      expect(isNgrokUrl('https://abc.ngrok-free.app/media/avatar.png')).toBe(true);
      expect(isNgrokUrl('https://xyz.ngrok.io/media/photo.jpg')).toBe(true);
      expect(isNgrokUrl('https://sub.ngrok.app/media/short.mp4')).toBe(true);
    });

    it('returns false for localhost and standard non-ngrok domains', () => {
      expect(isNgrokUrl('http://localhost:5114/media/avatar.webp')).toBe(false);
      expect(isNgrokUrl('https://example.com/photo.jpg')).toBe(false);
      expect(isNgrokUrl('https://cdn.mysocial.vn/assets/logo.png')).toBe(false);
      expect(isNgrokUrl('')).toBe(false);
      expect(isNgrokUrl(null)).toBe(false);
      expect(isNgrokUrl(undefined)).toBe(false);
    });
  });

  describe('fetchMediaBlobUrl', () => {
    it('returns immediately for blob: and data: URLs without network fetch', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const blobResult = await fetchMediaBlobUrl('blob:http://localhost:5173/test-uuid');
      expect(blobResult).toBe('blob:http://localhost:5173/test-uuid');

      const dataResult = await fetchMediaBlobUrl('data:image/png;base64,iVBORw0KGgo=');
      expect(dataResult).toBe('data:image/png;base64,iVBORw0KGgo=');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('sends ngrok-skip-browser-warning header and returns object URL on success', async () => {
      const fakeBlob = new Blob(['image data'], { type: 'image/webp' });
      const createObjectURLMock = vi.fn(() => 'blob:http://localhost:5173/mock-blob-1');
      globalThis.URL.createObjectURL = createObjectURLMock;

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/webp' }),
        blob: async () => fakeBlob,
      } as Response);

      const targetUrl = 'https://provincially-dialytic-stefany.ngrok-free.dev/media/posts/test.webp';
      const result = await fetchMediaBlobUrl(targetUrl);

      expect(fetchSpy).toHaveBeenCalledWith(targetUrl, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      expect(createObjectURLMock).toHaveBeenCalledWith(fakeBlob);
      expect(result).toBe('blob:http://localhost:5173/mock-blob-1');

      // Subsequent call should hit cache without calling fetch again
      const cachedResult = await fetchMediaBlobUrl(targetUrl);
      expect(cachedResult).toBe('blob:http://localhost:5173/mock-blob-1');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('throws error when response content-type is text/html (ngrok warning page)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        blob: async () => new Blob(['<html>Warning</html>'], { type: 'text/html' }),
      } as Response);

      await expect(
        fetchMediaBlobUrl('https://provincially-dialytic-stefany.ngrok-free.dev/media/blocked.webp')
      ).rejects.toThrow('Received HTML instead of media content');
    });
  });
});
