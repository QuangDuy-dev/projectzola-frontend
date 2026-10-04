import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-lg)',
    transition: 'transform var(--dur-feedback) var(--ease-out), background var(--dur-feedback) var(--ease-out), border-color var(--dur-feedback) var(--ease-out), box-shadow var(--dur-feedback) var(--ease-out), opacity var(--dur-feedback) var(--ease-out)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    border: '1px solid transparent',
    userSelect: 'none',
    letterSpacing: '-0.01em',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { minHeight: '34px', padding: '0.35rem 0.75rem', fontSize: '0.8125rem' },
    md: { minHeight: '40px', padding: '0.5rem 1.125rem', fontSize: '0.875rem' },
    lg: { minHeight: '46px', padding: '0.75rem 1.5rem', fontSize: '1rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--color-primary-gradient)',
      color: 'var(--color-primary-text)',
      boxShadow: 'var(--shadow-glow)',
    },
    secondary: {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
      borderColor: 'rgba(255, 90, 0, 0.15)',
    },
    outline: {
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border-strong)',
      color: 'var(--color-text)',
      boxShadow: 'var(--shadow-sm)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
      boxShadow: '0 4px 12px -2px rgba(239, 68, 68, 0.3)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text)',
    },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={`btn-interactive ${className}`}
      onMouseDown={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'scale(0.96)';
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'none';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
      }}
      onTouchStart={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'scale(0.96)';
        }
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'none';
      }}
      {...props}
    >
      {isLoading && (
        <span
          style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </button>
  );
};
