import { describe, it, expect } from 'vitest';
import { validateMediaFiles } from '../utils/chatMediaHelper';

function createDummyFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

describe('chatMediaHelper - validateMediaFiles', () => {
  it('rejects empty file list', () => {
    const res = validateMediaFiles([]);
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('accepts 1 to 10 images within size limit', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      createDummyFile(`photo${i}.png`, 'image/png', 1024 * 1024)
    );
    const res = validateMediaFiles(files);
    expect(res.valid).toBe(true);
    expect(res.isImage).toBe(true);
  });

  it('rejects more than 10 images', () => {
    const files = Array.from({ length: 11 }, (_, i) =>
      createDummyFile(`photo${i}.jpg`, 'image/jpeg', 500 * 1024)
    );
    const res = validateMediaFiles(files);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('tối đa 10 ảnh');
  });

  it('rejects image over 20MB', () => {
    const file = createDummyFile('large.jpg', 'image/jpeg', 25 * 1024 * 1024);
    const res = validateMediaFiles([file]);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('vượt quá dung lượng cho phép');
  });

  it('accepts 1 video under 50MB', () => {
    const video = createDummyFile('clip.mp4', 'video/mp4', 30 * 1024 * 1024);
    const res = validateMediaFiles([video]);
    expect(res.valid).toBe(true);
    expect(res.isVideo).toBe(true);
  });

  it('rejects video over 50MB', () => {
    const video = createDummyFile('huge.mp4', 'video/mp4', 55 * 1024 * 1024);
    const res = validateMediaFiles([video]);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('vượt quá giới hạn cho phép (50MB)');
  });

  it('rejects more than 1 video', () => {
    const v1 = createDummyFile('clip1.mp4', 'video/mp4', 10 * 1024 * 1024);
    const v2 = createDummyFile('clip2.mp4', 'video/mp4', 10 * 1024 * 1024);
    const res = validateMediaFiles([v1, v2]);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('tối đa 1 video');
  });

  it('rejects mixture of images and videos', () => {
    const img = createDummyFile('photo.png', 'image/png', 1024 * 1024);
    const video = createDummyFile('clip.mp4', 'video/mp4', 5 * 1024 * 1024);
    const res = validateMediaFiles([img, video]);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Không thể gửi đồng thời cả hình ảnh và video');
  });
});
