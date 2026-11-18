import { Monitor, Smartphone, LogOut, ShieldCheck, Clock, Globe } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { formatDate } from '../../utils/formatters';
import type { UserSessionDto } from '../../types';

export interface ActiveSessionsPanelProps {
  sessions: UserSessionDto[];
  isLoading?: boolean;
  error?: string | null;
  revokingSessionId?: string | null;
  isLoggingOutAll?: boolean;
  onRevokeSession: (sessionId: string) => void | Promise<void>;
  onLogoutAll: () => void | Promise<void>;
}

export function ActiveSessionsPanel({
  sessions = [],
  isLoading = false,
  error = null,
  revokingSessionId = null,
  isLoggingOutAll = false,
  onRevokeSession,
  onLogoutAll,
}: ActiveSessionsPanelProps) {
  const isMobileDevice = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase();
    return (
      lower.includes('iphone') ||
      lower.includes('android') ||
      lower.includes('mobile') ||
      lower.includes('ipad')
    );
  };

  return (
    <Card style={{ padding: '1.25rem' }}>
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Thiết bị đang đăng nhập
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.125rem 0 0' }}>
              Danh sách các thiết bị và phiên đăng nhập đang hoạt động của tài khoản
            </p>
          </div>
        </div>

        {sessions && sessions.length > 0 && !isLoading && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLogoutAll()}
            isLoading={isLoggingOutAll}
            disabled={isLoggingOutAll}
            style={{
              color: 'var(--color-danger)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <LogOut size={15} />
            <span>Đăng xuất tất cả thiết bị</span>
          </Button>
        )}
      </div>

      {/* States */}
      {isLoading ? (
        <LoadingState message="Đang tải danh sách thiết bị..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="Chưa có phiên đăng nhập nào"
          description="Hiện tại không có phiên đăng nhập nào khác đang hoạt động."
          icon={<ShieldCheck size={28} />}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sessions.map((session) => {
            const isMobile = isMobileDevice(session.deviceInfo);
            const isRevoking = revokingSessionId === session.id;

            return (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: session.isCurrent
                    ? '1.5px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                  backgroundColor: session.isCurrent
                    ? 'rgba(255, 90, 0, 0.03)'
                    : 'var(--color-surface)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: '220px', flex: 1 }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: session.isCurrent
                        ? 'var(--color-primary-light)'
                        : 'var(--color-surface-hover)',
                      color: session.isCurrent
                        ? 'var(--color-primary)'
                        : 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isMobile ? <Smartphone size={20} /> : <Monitor size={20} />}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                        {session.deviceInfo}
                      </span>
                      {session.isCurrent && (
                        <Badge variant="success">Thiết bị hiện tại</Badge>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {session.ipAddress && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Globe size={13} />
                          <span>{session.ipAddress}</span>
                        </span>
                      )}

                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} />
                        <span>Hoạt động: {formatDate(session.lastUsedAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRevokeSession(session.id)}
                      isLoading={isRevoking}
                      disabled={isRevoking || isLoggingOutAll}
                      style={{
                        color: 'var(--color-danger)',
                        borderColor: 'rgba(239, 68, 68, 0.25)',
                      }}
                    >
                      <LogOut size={14} />
                      <span>Đăng xuất</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default ActiveSessionsPanel;
