import React from 'react';
import { Reply, X } from 'lucide-react';
import type { MessageDto } from '../../../types';

interface ReplyPreviewBarProps {
  replyingTo: MessageDto | null;
  onCancel: () => void;
}

export const ReplyPreviewBar: React.FC<ReplyPreviewBarProps> = ({ replyingTo, onCancel }) => {
  if (!replyingTo) return null;

  const contentSnippet =
    replyingTo.content ||
    (replyingTo.attachments && replyingTo.attachments.length > 0
      ? `[${replyingTo.attachments[0].attachmentType === 'Video' ? 'Video' : replyingTo.attachments[0].attachmentType === 'Audio' ? 'Tin nhắn thoại' : 'Hình ảnh'}]`
      : replyingTo.poll
        ? `[Bình chọn: ${replyingTo.poll.question}]`
        : 'Tin nhắn');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--color-surface-hover)',
        borderTop: '1px solid var(--color-border)',
        borderLeft: '3px solid var(--color-primary)',
        fontSize: '0.8125rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
        <Reply size={15} color="var(--color-primary)" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Trả lời {replyingTo.senderDisplayName || replyingTo.senderUsername}:
          </span>{' '}
          <span
            style={{
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              maxWidth: '300px',
              verticalAlign: 'bottom',
            }}
          >
            {contentSnippet}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Hủy trả lời"
      >
        <X size={15} />
      </button>
    </div>
  );
};
