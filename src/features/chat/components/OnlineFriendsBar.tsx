import React from 'react';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { usePresence } from '../../../hooks/usePresence';
import { formatRelativeTime } from '../../../utils/formatters';

interface OnlineFriendsBarProps {
  onSelectUser: (userId: string) => void;
}

export const OnlineFriendsBar: React.FC<OnlineFriendsBarProps> = ({ onSelectUser }) => {
  const { onlineFriends, isLoading } = usePresence();

  if (isLoading && onlineFriends.length === 0) {
    return null;
  }

  if (onlineFriends.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        padding: '0.625rem 0.75rem',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        overflowX: 'auto',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        scrollbarWidth: 'none',
      }}
    >
      {onlineFriends.map((friend) => {
        const tooltip = friend.isOnline
          ? `${friend.displayName} (Đang hoạt động)`
          : friend.lastSeenAt
            ? `${friend.displayName} (Hoạt động ${formatRelativeTime(friend.lastSeenAt)})`
            : `${friend.displayName} (Ngoại tuyến)`;

        return (
          <div
            key={friend.userId}
            onClick={() => onSelectUser(friend.userId)}
            title={tooltip}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
              flexShrink: 0,
              width: '56px',
              textAlign: 'center',
            }}
          >
            <div style={{ position: 'relative' }}>
              <UserAvatar
                avatarUrl={friend.avatarUrl}
                displayName={friend.displayName || friend.username}
                size={40}
                clickable={false}
              />
              {friend.isOnline && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '11px',
                    height: '11px',
                    backgroundColor: 'var(--color-success, #22c55e)',
                    border: '2px solid var(--color-surface)',
                    borderRadius: '50%',
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--color-text)',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              {friend.displayName.split(' ')[0] || friend.username}
            </span>
          </div>
        );
      })}
    </div>
  );
};
