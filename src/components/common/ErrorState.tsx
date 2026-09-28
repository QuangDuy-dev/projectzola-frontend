import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải được dữ liệu. Vui lòng thử lại.',
  onRetry,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        textAlign: 'center',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          width: '3rem',
          height: '3rem',
          borderRadius: '50%',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)' }}>{title}</h4>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '400px' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} style={{ marginTop: '0.5rem' }}>
          <RefreshCw size={14} />
          Thử lại
        </Button>
      )}
    </div>
  );
};
