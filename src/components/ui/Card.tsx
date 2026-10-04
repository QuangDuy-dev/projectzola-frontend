import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  style,
  className = '',
  ...props
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-md)',
        transition: hoverable ? 'transform var(--dur-feedback) var(--ease-out), box-shadow var(--dur-feedback) var(--ease-out), border-color var(--dur-feedback) var(--ease-out)' : undefined,
        ...style,
      }}
      className={className}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};
