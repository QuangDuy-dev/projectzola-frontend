import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  style,
  ...props
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: '#f1f5f9', color: '#475569' },
    primary: { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' },
    success: { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' },
    warning: { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    danger: { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
    info: { backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.125rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
