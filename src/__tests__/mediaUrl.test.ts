import { describe, it, expect } from 'vitest';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { APP_CONFIG } from '../app/config';

describe('resolveMediaUrl', () => {
  it('returns null for null, undefined, or empty strings', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
    expect(resolveMediaUrl('   ')).toBeNull();
  });

  it('preserves absolute URLs and special protocols', () => {
    expect(resolveMediaUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
    expect(resolveMediaUrl('http://localhost:5114/media/avatar.webp')).toBe('http://localhost:5114/media/avatar.webp');
    expect(resolveMediaUrl('blob:http://localhost:5173/uuid')).toBe('blob:http://localhost:5173/uuid');
    expect(resolveMediaUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('prepends apiBaseUrl to relative paths with leading slash', () => {
    const result = resolveMediaUrl('/media/posts/sample.webp');
    expect(result).toBe(`${APP_CONFIG.apiBaseUrl}/media/posts/sample.webp`);
  });

  it('prepends apiBaseUrl to relative paths without leading slash', () => {
    const result = resolveMediaUrl('media/posts/sample.webp');
    expect(result).toBe(`${APP_CONFIG.apiBaseUrl}/media/posts/sample.webp`);
  });

  it('sanitizes Windows backslashes into forward slashes', () => {
    const result = resolveMediaUrl('media\\videos\\short.mp4');
    expect(result).toBe(`${APP_CONFIG.apiBaseUrl}/media/videos/short.mp4`);
  });
});
