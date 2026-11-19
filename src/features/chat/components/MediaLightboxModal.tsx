import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { SafeVideo } from '../../../components/common/SafeVideo';
import type { MessageAttachmentDto } from '../../../types';

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: MessageAttachmentDto[];
  initialIndex?: number;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  isOpen,
  onClose,
  attachments,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, attachments.length]);

  if (!isOpen || attachments.length === 0) return null;

  const current = attachments[currentIndex] || attachments[0];
  const isVideo = current.attachmentType === 'Video' || current.mimeType.startsWith('video/');
  const resolvedUrl = resolveMediaUrl(current.storageUrl);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Top Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          zIndex: 10001,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        }}
      >
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {attachments.length > 1 && `${currentIndex + 1} / ${attachments.length}`}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {resolvedUrl && (
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              download={current.originalFileName || 'download'}
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <Download size={18} />
              <span>Tải xuống</span>
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Media Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isVideo ? (
          <SafeVideo
            src={current.storageUrl}
            posterUrl={current.thumbnailUrl}
            controls
            autoPlay
            style={{
              maxWidth: '85vw',
              maxHeight: '80vh',
              borderRadius: 'var(--radius-lg)',
            }}
          />
        ) : (
          <img
            src={resolvedUrl || ''}
            alt={current.originalFileName || 'Ảnh'}
            style={{
              maxWidth: '85vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          />
        )}
      </div>

      {/* Prev / Next buttons if multiple attachments */}
      {attachments.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
          >
            <ChevronLeft size={28} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}
    </div>
  );
};
