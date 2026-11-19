import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, ShieldCheck, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { chatService } from '../../services/api/services';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { UserAvatar } from '../../components/common/UserAvatar';

export const JoinByInvitePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: preview,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['group-invite', code],
    queryFn: () => (code ? chatService.getInvitePreview(code) : Promise.reject('No invite code')),
    enabled: !!code,
  });

  const handleJoin = async () => {
    if (!code) return;
    setIsJoining(true);
    setActionError(null);
    try {
      const res = await chatService.joinByInvite(code);
      if (res.eventType === 'JoinRequestCreated') {
        setRequestSent(true);
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Không thể tham gia nhóm.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '1rem' }}>
        <LoadingState message="Đang kiểm tra liên kết mời..." />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '1rem' }}>
        <ErrorState
          title="Liên kết không hợp lệ"
          message="Liên kết mời này không tồn tại hoặc đã hết hạn/bị đặt lại."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '1rem' }}>
      <Card style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <UserAvatar
            avatarUrl={preview.avatarUrl}
            displayName={preview.name}
            size={80}
            clickable={false}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-surface)',
            }}
          >
            <Users size={16} />
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
            {preview.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Badge variant="primary">{preview.memberCount} thành viên</Badge>
            {preview.requireJoinApproval && (
              <Badge variant="warning">Cần xét duyệt</Badge>
            )}
          </div>
        </div>

        {actionError && (
          <div
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
            }}
          >
            {actionError}
          </div>
        )}

        {preview.isAlreadyMember ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--color-success)',
                fontSize: '0.9375rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} />
              <span>Bạn đã là thành viên của nhóm này</span>
            </div>
            <Button variant="primary" onClick={() => navigate('/chat')} style={{ width: '100%' }}>
              <span>Vào trò chuyện</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        ) : requestSent || preview.hasPendingRequest ? (
          <div
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: 'var(--color-surface-hover)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Clock size={28} color="var(--color-warning, #eab308)" />
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Yêu cầu đang chờ xét duyệt</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Trưởng nhóm hoặc phó nhóm sẽ xem xét yêu cầu tham gia của bạn.
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('/chat')} style={{ marginTop: '0.5rem' }}>
              Quay lại tin nhắn
            </Button>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button
              variant="primary"
              size="lg"
              isLoading={isJoining}
              disabled={isJoining}
              onClick={handleJoin}
              style={{ width: '100%' }}
            >
              {preview.requireJoinApproval ? (
                <>
                  <ShieldCheck size={18} />
                  <span>Gửi yêu cầu tham gia nhóm</span>
                </>
              ) : (
                <>
                  <Users size={18} />
                  <span>Tham gia nhóm ngay</span>
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
              Bỏ qua
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
export default JoinByInvitePage;
