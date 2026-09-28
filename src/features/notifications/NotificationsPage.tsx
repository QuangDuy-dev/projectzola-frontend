import React from 'react';
import { Bell, CheckCheck, PackageCheck, Heart, MessageSquare, UserPlus, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatRelativeTime } from '../../utils/formatters';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'OrderUpdate':
        return <PackageCheck size={18} color="var(--color-primary)" />;
      case 'PostLike':
        return <Heart size={18} color="var(--color-danger)" />;
      case 'PostComment':
        return <MessageSquare size={18} color="var(--color-accent)" />;
      case 'NewFollower':
        return <UserPlus size={18} color="var(--color-success)" />;
      default:
        return <Info size={18} color="var(--color-info)" />;
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Thông báo hệ thống</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Thông báo đơn hàng, tương tác mạng xã hội được cập nhật tức thì (SignalR)
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            <CheckCheck size={16} /> Đánh dấu đã đọc tất cả
          </Button>
        )}
      </div>

      {isLoading && <LoadingState message="Đang tải thông báo..." />}

      {!isLoading && notifications.length === 0 && (
        <EmptyState
          icon={<Bell size={32} />}
          title="Không có thông báo nào"
          message="Bạn sẽ nhận được thông báo khi có người theo dõi, thích bài viết hoặc đơn hàng thay đổi trạng thái."
        />
      )}

      {!isLoading &&
        notifications.map((notif) => (
          <Card
            key={notif.id}
            onClick={() => !notif.isRead && markAsRead(notif.id)}
            style={{
              padding: '1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              cursor: notif.isRead ? 'default' : 'pointer',
              backgroundColor: notif.isRead ? 'var(--color-surface)' : 'var(--color-primary-light)',
              borderColor: notif.isRead ? 'var(--color-border)' : 'var(--color-primary)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {getNotificationIcon(notif.type)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: notif.isRead ? 600 : 700 }}>{notif.title}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {formatRelativeTime(notif.createdAt)}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginTop: '0.25rem' }}>
                {notif.content}
              </p>
            </div>
          </Card>
        ))}
    </div>
  );
};
