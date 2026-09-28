import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export interface UserAvatarProps {
  userId?: string;
  avatarUrl?: string | null;
  displayName?: string;
  size?: number;
  clickable?: boolean;
  style?: React.CSSProperties;
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  avatarUrl,
  displayName = '',
  size = 40,
  clickable = true,
  style,
}) => {
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  const resolved = resolveMediaUrl(avatarUrl);
  const isClickable = clickable && !!userId;
  const initials = getInitials(displayName);

  const handleClick = (e: React.MouseEvent) => {
    if (isClickable && userId) {
      e.stopPropagation();
      navigate(`/users/${userId}`);
    }
  };

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isClickable ? 'pointer' : 'default',
    userSelect: 'none',
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    fontWeight: 600,
    fontSize: `${Math.max(11, Math.round(size * 0.38))}px`,
    transition: 'transform 0.1s ease, opacity 0.1s ease',
    ...style,
  };

  if (!resolved || hasError) {
    return (
      <div
        style={containerStyle}
        onClick={handleClick}
        title={displayName || 'Người dùng'}
      >
        {initials ? initials : <User size={Math.round(size * 0.55)} />}
      </div>
    );
  }

  return (
    <div style={containerStyle} onClick={handleClick} title={displayName || 'Người dùng'}>
      <img
        src={resolved}
        alt={displayName || 'Avatar'}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
};
