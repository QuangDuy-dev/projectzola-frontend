import React, { useState } from 'react';
import { Image, Video, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; files?: File[] }) => Promise<any>;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const isVideo = filesArray.some((f) => f.type.startsWith('video/'));

      if (isVideo && filesArray.length > 1) {
        setError('Chỉ được tải lên tối đa 1 video cho mỗi bài viết.');
        return;
      }
      if (!isVideo && filesArray.length > 10) {
        setError('Chỉ được tải lên tối đa 10 ảnh cho mỗi bài viết.');
        return;
      }

      setError(null);
      setSelectedFiles(filesArray);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ content, files: selectedFiles });
      setContent('');
      setSelectedFiles([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo bài viết.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo bài viết mới" maxWidth="540px">
      {error && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bạn đang nghĩ gì thế?"
          rows={4}
          required
        />

        {/* Media Previews */}
        {selectedFiles.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                }}
              >
                {file.type.startsWith('video/') ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#000',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.625rem',
                    }}
                  >
                    VIDEO
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <Image size={16} />
            Thêm ảnh (tối đa 10)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <Video size={16} />
            Thêm video (≤60s)
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Đăng bài
          </Button>
        </div>
      </form>
    </Modal>
  );
};
