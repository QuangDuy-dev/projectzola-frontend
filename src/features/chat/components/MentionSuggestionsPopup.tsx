import React from 'react';
import { Users } from 'lucide-react';
import { UserAvatar } from '../../../components/common/UserAvatar';
import type { MentionSuggestion } from '../../../utils/mentionHelper';

interface MentionSuggestionsPopupProps {
  suggestions: MentionSuggestion[];
  onSelect: (s: MentionSuggestion) => void;
  isOpen: boolean;
}

export const MentionSuggestionsPopup: React.FC<MentionSuggestionsPopupProps> = ({
  suggestions,
  onSelect,
  isOpen,
}) => {
  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '1rem',
        right: '1rem',
        maxHeight: '190px',
        overflowY: 'auto',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 40,
        marginBottom: '0.5rem',
        padding: '0.35rem 0',
      }}
    >
      <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
        Nhắc đến thành viên
      </div>
      {suggestions.map((s) => (
        <div
          key={s.id}
          onClick={() => onSelect(s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            cursor: 'pointer',
            transition: 'background-color 0.1s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {s.isAll ? (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={15} />
            </div>
          ) : (
            <UserAvatar displayName={s.displayName} size={28} clickable={false} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {s.displayName}
            </span>
            {s.isAll ? (
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)' }}>
                Thông báo đến tất cả thành viên trong nhóm
              </span>
            ) : (
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                @{s.username}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
