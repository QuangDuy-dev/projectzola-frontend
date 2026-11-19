import { useEffect, useState } from 'react';
import { X, Image as ImageIcon, Film, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface AttachmentItem {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

interface AttachmentPickerProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  uploadProgress?: number | null;
  uploadError?: string | null;
  onRetryUpload?: () => void;
  isUploading?: boolean;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  files,
  onRemoveFile,
  onClearAll,
  uploadProgress,
  uploadError,
  onRetryUpload,
  isUploading,
}) => {
  const [items, setItems] = useState<AttachmentItem[]>([]);

  useEffect(() => {
    const newItems: AttachmentItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
    }));

    setItems(newItems);

    return () => {
      newItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Đính kèm ({files.length} tệp)
        </span>
        {!isUploading && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Horizontal thumbnail scroll */}
      <div
        style={{
          display: 'flex',
          gap: '0.625rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: '#1f2937',
              border: '1px solid var(--color-border)',
            }}
          >
            {item.isVideo ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#000000',
                }}
              >
                <Film size={24} color="#ffffff" />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '2px',
                    fontSize: '0.625rem',
                    color: '#ffffff',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '1px 3px',
                    borderRadius: '2px',
                  }}
                >
                  Video
                </span>
              </div>
            ) : (
              <img
                src={item.previewUrl}
                alt={item.file.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}

            {!isUploading && (
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar if uploading */}
      {isUploading && typeof uploadProgress === 'number' && (
        <div style={{ marginTop: '0.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              marginBottom: '0.25rem',
            }}
          >
            <span>Đang tải lên...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'var(--color-border)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Upload error banner with retry */}
      {uploadError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--color-error-light, #fee2e2)',
            color: 'var(--color-error, #dc2626)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            marginTop: '0.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <AlertTriangle size={15} />
            <span>{uploadError}</span>
          </div>
          {onRetryUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryUpload}
              style={{ padding: '2px 8px', height: '26px', fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} />
              <span>Thử lại</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
