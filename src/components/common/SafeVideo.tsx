import React, { useRef } from 'react';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { useMediaBlobUrl } from '../../utils/mediaBlob';

export interface SafeVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
  src?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
}

export const SafeVideo = React.forwardRef<HTMLVideoElement, SafeVideoProps>(
  ({ src, videoUrl, posterUrl, style, controls = true, preload = 'metadata', ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLVideoElement | null>(null);
    const targetUrl = videoUrl || src;
    const resolvedVideo = resolveMediaUrl(targetUrl);
    const resolvedPoster = resolveMediaUrl(posterUrl);

    const { blobUrl: videoBlobUrl, isError: isVideoError } = useMediaBlobUrl(resolvedVideo);
    const { blobUrl: posterBlobUrl } = useMediaBlobUrl(resolvedPoster);

    if (!resolvedVideo || isVideoError) {
      return (
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            borderRadius: 'var(--radius-md)',
            ...style,
          }}
        >
          <span>Không có video khả dụng</span>
        </div>
      );
    }

    return (
      <video
        ref={(el) => {
          internalRef.current = el;
          if (typeof forwardedRef === 'function') {
            forwardedRef(el);
          } else if (forwardedRef) {
            forwardedRef.current = el;
          }
        }}
        src={videoBlobUrl || undefined}
        poster={posterBlobUrl || undefined}
        preload={preload}
        controls={controls}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: '#000000',
          borderRadius: 'var(--radius-md)',
          ...style,
        }}
        {...props}
      />
    );
  }
);

SafeVideo.displayName = 'SafeVideo';
