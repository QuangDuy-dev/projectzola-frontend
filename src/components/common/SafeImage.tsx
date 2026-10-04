import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { useMediaBlobUrl } from '../../utils/mediaBlob';

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  fallbackSrc,
  style,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const resolved = resolveMediaUrl(src);
  const { blobUrl, isError, isLoading } = useMediaBlobUrl(resolved);

  if (!resolved || hasError || isError) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          style={{ objectFit: 'cover', ...style }}
          onError={() => setHasError(true)}
          {...props}
        />
      );
    }

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f1f5f9',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'inherit',
          ...style,
        }}
      >
        <ImageIcon size={24} />
      </div>
    );
  }

  // If still loading ngrok blob, show subtle skeleton placeholder to prevent direct headerless request
  if (isLoading || !blobUrl) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f1f5f9',
          borderRadius: 'inherit',
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      style={{
        objectFit: 'cover',
        ...style,
      }}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};
