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
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(226, 232, 240, 0.7)',
        boxShadow: 'var(--shadow-card)',
        padding: 'var(--spacing-md)',
        transition: hoverable ? 'transform var(--dur-feedback) var(--ease-out), box-shadow var(--dur-feedback) var(--ease-out), border-color var(--dur-feedback) var(--ease-out)' : undefined,
        ...style,
      }}
      className={className}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
          e.currentTarget.style.borderColor = 'rgba(255, 90, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.7)';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};
