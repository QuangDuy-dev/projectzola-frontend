import { useState } from 'react';
import { SafeImage } from '../../../components/common/SafeImage';
import { SafeVideo } from '../../../components/common/SafeVideo';
import { MediaLightboxModal } from './MediaLightboxModal';
import type { MessageAttachmentDto } from '../../../types';

interface MediaGridProps {
  attachments: MessageAttachmentDto[];
  isMine?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ attachments }) => {
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const imageAttachments = attachments.filter(
    (a) => a.attachmentType === 'Image' || a.mimeType.startsWith('image/')
  );
  const videoAttachments = attachments.filter(
    (a) => a.attachmentType === 'Video' || a.mimeType.startsWith('video/')
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      {/* Video Attachments */}
      {videoAttachments.map((video) => (
        <div
          key={video.id}
          style={{
            maxWidth: '360px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#000000',
          }}
        >
          <SafeVideo
            src={video.storageUrl}
            posterUrl={video.thumbnailUrl}
            controls
            style={{
              width: '100%',
              maxHeight: '260px',
              borderRadius: 'var(--radius-lg)',
              display: 'block',
            }}
          />
        </div>
      ))}

      {/* Image Attachments Grid */}
      {imageAttachments.length > 0 && (
        <div
          style={{
            display: 'grid',
            gap: '4px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            maxWidth: imageAttachments.length === 1 ? '320px' : '360px',
            gridTemplateColumns:
              imageAttachments.length === 1
                ? '1fr'
                : imageAttachments.length === 2
                  ? '1fr 1fr'
                  : 'repeat(3, 1fr)',
          }}
        >
          {imageAttachments.map((img, idx) => {
            const isSingle = imageAttachments.length === 1;

            return (
              <div
                key={img.id}
                onClick={() => setSelectedAttachmentIndex(idx)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: isSingle ? 'auto' : '110px',
                  maxHeight: isSingle ? '280px' : '110px',
                  cursor: 'pointer',
                  backgroundColor: '#1e293b',
                  overflow: 'hidden',
                }}
              >
                <SafeImage
                  src={img.thumbnailUrl || img.storageUrl}
                  alt={img.originalFileName || 'Ảnh'}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedAttachmentIndex !== null && (
        <MediaLightboxModal
          isOpen={true}
          onClose={() => setSelectedAttachmentIndex(null)}
          attachments={imageAttachments}
          initialIndex={selectedAttachmentIndex}
        />
      )}
    </div>
  );
};
