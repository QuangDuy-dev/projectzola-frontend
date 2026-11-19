import React, { useState } from 'react';
import { Pin, ChevronRight, X } from 'lucide-react';
import type { MessageDto } from '../../../types';

interface PinnedMessagesBarProps {
  pinnedMessages: MessageDto[];
  onScrollToMessage: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  canUnpin?: boolean;
}

export const PinnedMessagesBar: React.FC<PinnedMessagesBarProps> = ({
  pinnedMessages,
  onScrollToMessage,
  onUnpin,
  canUnpin = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const currentMsg = pinnedMessages[currentIndex] || pinnedMessages[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const contentSnippet =
    currentMsg.content ||
    (currentMsg.attachments && currentMsg.attachments.length > 0
      ? `[${currentMsg.attachments[0].attachmentType === 'Video' ? 'Video' : currentMsg.attachments[0].attachmentType === 'Audio' ? 'Tin nhắn thoại' : 'Hình ảnh'}]`
      : currentMsg.poll
        ? `[Bình chọn: ${currentMsg.poll.question}]`
        : 'Tin nhắn đã ghim');

  return (
    <div
      onClick={() => onScrollToMessage(currentMsg.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.4rem 1rem',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        fontSize: '0.8125rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
        <Pin size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
            Ghim:
          </span>
          <span style={{ fontWeight: 500, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
            {currentMsg.senderDisplayName || currentMsg.senderUsername}:
          </span>
          <span
            style={{
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {contentSnippet}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
        {pinnedMessages.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem 0.4rem',
            }}
          >
            <span>{currentIndex + 1}/{pinnedMessages.length}</span>
            <ChevronRight size={13} />
          </button>
        )}

        {canUnpin && onUnpin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnpin(currentMsg.id);
            }}
            title="Bỏ ghim tin nhắn này"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
