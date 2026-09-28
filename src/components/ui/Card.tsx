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
        transition: hoverable ? 'transform 0.15s ease, box-shadow 0.15s ease' : undefined,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};
