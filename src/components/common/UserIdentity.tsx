import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import { formatRelativeTime } from '../../utils/formatters';

export interface UserIdentityProps {
  userId?: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  timestamp?: string | Date;
  subtitle?: React.ReactNode;
  avatarSize?: number;
  clickable?: boolean;
  style?: React.CSSProperties;
}

export const UserIdentity: React.FC<UserIdentityProps> = ({
  userId,
  displayName = 'Người dùng',
  username,
  avatarUrl,
  timestamp,
  subtitle,
  avatarSize = 40,
  clickable = true,
  style,
}) => {
  const navigate = useNavigate();
  const isClickable = clickable && !!userId;

  const handleNameClick = (e: React.MouseEvent) => {
    if (isClickable && userId) {
      e.stopPropagation();
      navigate(`/users/${userId}`);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', ...style }}>
      <UserAvatar
        userId={userId}
        avatarUrl={avatarUrl}
        displayName={displayName}
        size={avatarSize}
        clickable={clickable}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          onClick={handleNameClick}
          style={{
            fontSize: avatarSize >= 40 ? '0.9375rem' : '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            cursor: isClickable ? 'pointer' : 'default',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          onMouseEnter={(e) => {
            if (isClickable) (e.currentTarget as HTMLElement).style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            if (isClickable) (e.currentTarget as HTMLElement).style.textDecoration = 'none';
          }}
        >
          {displayName}
        </span>

        {subtitle ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtitle}</div>
        ) : timestamp ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {formatRelativeTime(typeof timestamp === 'string' ? timestamp : timestamp.toISOString())}
          </span>
        ) : username ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>@{username}</span>
        ) : null}
      </div>
    </div>
  );
};
