import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, style, id, rows = 3, ...props }, ref) => {
    const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

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
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            outline: 'none',
            fontSize: '0.9375rem',
            resize: 'vertical',
            ...style,
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
