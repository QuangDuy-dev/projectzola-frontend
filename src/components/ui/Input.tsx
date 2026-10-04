import React, { useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, style, id, onFocus, onBlur, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          style={{
            width: '100%',
            minHeight: '40px',
            padding: '0.55rem 0.875rem',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${error ? 'var(--color-danger)' : isFocused ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            outline: 'none',
            fontSize: '0.875rem',
            boxShadow: isFocused && !error ? '0 0 0 3.5px var(--color-primary-glow)' : 'var(--shadow-sm)',
            transition: 'border-color var(--dur-feedback) var(--ease-out), box-shadow var(--dur-feedback) var(--ease-out)',
            ...style,
          }}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 500 }}>{error}</span>
        )}
        {helperText && !error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
