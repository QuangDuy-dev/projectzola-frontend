import { useState } from 'react';
import { Check, Lock, Users, Clock } from 'lucide-react';
import { formatRelativeTime } from '../../../utils/formatters';
import type { ChatPollDto } from '../../../types';

interface PollBubbleProps {
  poll: ChatPollDto;
  currentUserId?: string;
  canClosePoll?: boolean;
  onVote: (optionIds: string[]) => Promise<void>;
  onClosePoll: () => Promise<void>;
}

export const PollBubble: React.FC<PollBubbleProps> = ({
  poll,
  canClosePoll,
  onVote,
  onClosePoll,
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const totalVotes = poll.totalVotes || poll.options.reduce((sum, o) => sum + (o.voteCount || 0), 0);
  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false;
  const isPollInactive = poll.isClosed || isExpired;

  const handleOptionClick = async (optionId: string) => {
    if (isPollInactive || isVoting) return;

    let nextOptionIds: string[];

    if (poll.allowMultipleChoices) {
      // Toggle selection in multiple choice mode
      const currentSelected = poll.options
        .filter((o) => o.votedByCurrentUser)
        .map((o) => o.id);

      if (currentSelected.includes(optionId)) {
        nextOptionIds = currentSelected.filter((id) => id !== optionId);
      } else {
        nextOptionIds = [...currentSelected, optionId];
      }
    } else {
      // Single choice mode: if already selected, clicking it again unselects, else selects it
      const currentSelected = poll.options.find((o) => o.votedByCurrentUser);
      if (currentSelected?.id === optionId) {
        nextOptionIds = [];
      } else {
        nextOptionIds = [optionId];
      }
    }

    setIsVoting(true);
    try {
      await onVote(nextOptionIds);
    } catch (err: any) {
      console.error('Vote poll error:', err);
      alert(err?.response?.data?.message || err.message || 'Lỗi bỏ phiếu.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleClose = async () => {
    if (window.confirm('Bạn có chắc muốn đóng cuộc bình chọn này không?')) {
      setIsClosing(true);
      try {
        await onClosePoll();
      } catch (err: any) {
        console.error('Close poll error:', err);
        alert(err?.response?.data?.message || err.message || 'Lỗi đóng bình chọn.');
      } finally {
        setIsClosing(false);
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '0.875rem 1rem',
        minWidth: '260px',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Poll Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, lineHeight: '1.3' }}>
            {poll.question}
          </h4>
          {isPollInactive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.6875rem',
                backgroundColor: 'var(--color-surface-hover)',
                color: 'var(--color-text-muted)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <Lock size={11} />
              <span>Đã đóng</span>
            </span>
          )}
        </div>

        {/* Metadata badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
            marginTop: '0.375rem',
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {poll.allowMultipleChoices && (
            <span style={{ backgroundColor: 'var(--color-surface-hover)', padding: '1px 6px', borderRadius: '4px' }}>
              Nhiều lựa chọn
            </span>
          )}
          {poll.isAnonymous ? (
            <span style={{ backgroundColor: 'var(--color-surface-hover)', padding: '1px 6px', borderRadius: '4px' }}>
              Ẩn danh
            </span>
          ) : (
            <span style={{ backgroundColor: 'var(--color-surface-hover)', padding: '1px 6px', borderRadius: '4px' }}>
              Công khai
            </span>
          )}
          {poll.expiresAt && !poll.isClosed && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                color: isExpired ? 'var(--color-error)' : 'var(--color-text-muted)',
              }}
            >
              <Clock size={11} />
              <span>{isExpired ? 'Hết hạn' : `Hạn: ${formatRelativeTime(poll.expiresAt)}`}</span>
            </span>
          )}
        </div>
      </div>

      {/* Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {poll.options.map((option) => {
          const voteCount = option.voteCount || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = option.votedByCurrentUser;

          return (
            <div
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                overflow: 'hidden',
                cursor: isPollInactive ? 'default' : 'pointer',
                backgroundColor: 'var(--color-background)',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Progress fill bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${percentage}%`,
                  backgroundColor: isSelected
                    ? 'var(--color-primary-light, rgba(59, 130, 246, 0.18))'
                    : 'var(--color-surface-hover)',
                  transition: 'width 0.3s ease',
                  zIndex: 0,
                }}
              />

              {/* Option content */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: poll.allowMultipleChoices ? '3px' : '50%',
                      border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={11} color="#ffffff" strokeWidth={3} />}
                  </div>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      wordBreak: 'break-word',
                    }}
                  >
                    {option.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {voteCount}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>
                    {percentage}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Users size={13} />
          <span>
            {totalVotes} lượt bình chọn
            {poll.totalVoters ? ` (${poll.totalVoters} người)` : ''}
          </span>
        </div>

        {canClosePoll && !poll.isClosed && !isExpired && (
          <button
            type="button"
            onClick={handleClose}
            disabled={isClosing}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-error, #dc2626)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 4px',
            }}
          >
            {isClosing ? 'Đang đóng...' : 'Đóng bình chọn'}
          </button>
        )}
      </div>
    </div>
  );
};
