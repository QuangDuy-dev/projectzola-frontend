import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, style, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            outline: 'none',
            fontSize: '0.9375rem',
            transition: 'border-color 0.15s ease',
            ...style,
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{error}</span>
        )}
        {helperText && !error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
