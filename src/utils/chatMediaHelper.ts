export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  isImage?: boolean;
  isVideo?: boolean;
}

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validates selected media files before upload:
 * - Must not mix images and videos
 * - Max 10 images, each <= 20MB
 * - Exactly 1 video, <= 50MB
 */
export function validateMediaFiles(files: File[]): MediaValidationResult {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Chưa có tệp nào được chọn.' };
  }

  const isImageFile = (f: File) => f.type.startsWith('image/');
  const isVideoFile = (f: File) => f.type.startsWith('video/');

  const hasImages = files.some(isImageFile);
  const hasVideos = files.some(isVideoFile);

  if (hasImages && hasVideos) {
    return {
      valid: false,
      error: 'Không thể gửi đồng thời cả hình ảnh và video. Vui lòng chỉ chọn ảnh hoặc 1 video.',
    };
  }

  if (hasVideos) {
    if (files.length > 1) {
      return {
        valid: false,
        isVideo: true,
        error: 'Chỉ được gửi tối đa 1 video mỗi lần.',
      };
    }
    const video = files[0];
    if (video.size > MAX_VIDEO_SIZE) {
      return {
        valid: false,
        isVideo: true,
        error: `Dung lượng video vượt quá giới hạn cho phép (50MB). Tệp hiện tại: ${(video.size / (1024 * 1024)).toFixed(1)}MB.`,
      };
    }
    return { valid: true, isVideo: true };
  }

  if (hasImages) {
    if (files.length > MAX_IMAGES) {
      return {
        valid: false,
        isImage: true,
        error: `Chỉ được gửi tối đa ${MAX_IMAGES} ảnh mỗi lần. Bạn đã chọn ${files.length} ảnh.`,
      };
    }
    for (const img of files) {
      if (img.size > MAX_IMAGE_SIZE) {
        return {
          valid: false,
          isImage: true,
          error: `Ảnh "${img.name}" vượt quá dung lượng cho phép (20MB).`,
        };
      }
    }
    return { valid: true, isImage: true };
  }

  return {
    valid: false,
    error: 'Định dạng tệp không được hỗ trợ. Vui lòng chọn ảnh (JPEG, PNG, WebP) hoặc video (MP4, WebM).',
  };
}
