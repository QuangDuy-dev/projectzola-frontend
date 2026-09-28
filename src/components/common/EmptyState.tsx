import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Chưa có dữ liệu',
  message,
  description,
  icon,
  action,
}) => {
  const displayMessage = message || description || 'Danh sách hiện tại đang trống.';
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
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--color-surface-hover)',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon || <Inbox size={28} />}
      </div>
      <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)' }}>{title}</h4>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '400px' }}>
        {displayMessage}
      </p>
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
};
