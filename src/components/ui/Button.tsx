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
    borderRadius: 'var(--radius-md)',
    transition: 'transform var(--dur-feedback) var(--ease-out), background-color var(--dur-feedback) var(--ease-out), border-color var(--dur-feedback) var(--ease-out), box-shadow var(--dur-feedback) var(--ease-out), opacity var(--dur-feedback) var(--ease-out)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    border: '1px solid transparent',
    userSelect: 'none',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-primary-text)',
      boxShadow: 'var(--shadow-glow)',
    },
    secondary: {
      backgroundColor: 'var(--color-surface-hover)',
      color: 'var(--color-text)',
      borderColor: 'var(--color-border)',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: 'var(--color-border)',
      color: 'var(--color-text)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
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
