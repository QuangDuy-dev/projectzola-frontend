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
        padding: '0.15rem 0.55rem',
        fontSize: '0.72rem',
        fontWeight: 700,
        borderRadius: 'var(--radius-full)',
        letterSpacing: '0.2px',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
