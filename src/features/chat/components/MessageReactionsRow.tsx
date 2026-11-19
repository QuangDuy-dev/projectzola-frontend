import React from 'react';
import type { MessageReactionSummaryDto } from '../../../types';

export const STANDARD_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface MessageReactionsRowProps {
  reactions?: MessageReactionSummaryDto[];
  onToggleReaction: (emoji: string) => void;
  isMine: boolean;
}

export const MessageReactionsRow: React.FC<MessageReactionsRowProps> = ({
  reactions,
  onToggleReaction,
  isMine,
}) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.25rem',
        marginTop: '0.25rem',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
      }}
    >
      {reactions.map((r) => {
        const isReacted = r.reactedByCurrentUser;

        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onToggleReaction(r.emoji)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              border: isReacted
                ? '1px solid var(--color-primary)'
                : '1px solid var(--color-border)',
              backgroundColor: isReacted
                ? 'var(--color-primary-light)'
                : 'var(--color-surface)',
              color: isReacted ? 'var(--color-primary)' : 'var(--color-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.1s ease',
            }}
          >
            <span>{r.emoji}</span>
            <span>{r.count}</span>
          </button>
        );
      })}
    </div>
  );
};

interface QuickReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

export const QuickReactionPicker: React.FC<QuickReactionPickerProps> = ({ onSelectEmoji }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.5rem',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--color-border)',
      }}
    >
      {STANDARD_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelectEmoji(emoji)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.125rem',
            cursor: 'pointer',
            padding: '0.1rem 0.2rem',
            borderRadius: '50%',
            transition: 'transform 0.1s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
