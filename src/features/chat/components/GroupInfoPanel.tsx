import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  Crown,
  Edit2,
  LogOut,
  MoreVertical,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserMinus,
  UserX,
  X,
  BellOff,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { usePresence } from '../../../hooks/usePresence';
import { chatService } from '../../../services/api/services';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { UserAvatar } from '../../../components/common/UserAvatar';
import type { ConversationDto, ConversationMemberDto, GroupJoinRequestDto } from '../../../types';

interface GroupInfoPanelProps {
  conversation: ConversationDto;
  onClose: () => void;
  onConversationUpdated?: (updated: ConversationDto) => void;
  onConversationDeleted?: () => void;
}

export const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({
  conversation,
  onClose,
  onConversationUpdated,
  onConversationDeleted,
}) => {
  const { user } = useAuth();
  const { isOnline, onlineFriends } = usePresence();

  // Current user member object and permissions
  const currentMember = conversation.members.find((m) => m.userId === user?.id);
  const currentRole = currentMember?.role || conversation.currentUserRole || 'Member';
  const isOwner = currentRole === 'Owner';
  const isAdmin = currentRole === 'Admin' || isOwner;

  // Editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(conversation.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isResettingLink, setIsResettingLink] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Settings toggles
  const [onlyAdminsCanSend, setOnlyAdminsCanSend] = useState(conversation.onlyAdminsCanSend ?? false);
  const [requireJoinApproval, setRequireJoinApproval] = useState(conversation.requireJoinApproval ?? false);

  // Join requests
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequestDto[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Modals
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [selectedAddUserIds, setSelectedAddUserIds] = useState<string[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  const [nicknameModalMember, setNicknameModalMember] = useState<ConversationMemberDto | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setNameInput(conversation.name || '');
    setOnlyAdminsCanSend(conversation.onlyAdminsCanSend ?? false);
    setRequireJoinApproval(conversation.requireJoinApproval ?? false);
  }, [conversation]);

  // Load join requests if admin and approval required
  useEffect(() => {
    if (isAdmin && conversation.requireJoinApproval) {
      loadJoinRequests();
    }
  }, [conversation.id, isAdmin, conversation.requireJoinApproval]);

  const loadJoinRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const list = await chatService.getJoinRequests(conversation.id);
      setJoinRequests(list);
    } catch (err) {
      console.warn('Failed to load join requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setIsSavingName(true);
    try {
      const res = await chatService.updateGroupSettings(conversation.id, {
        name: nameInput.trim(),
      });
      setIsEditingName(false);
      showStatus('Đã đổi tên nhóm thành công.');
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi đổi tên nhóm.', 'error');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await chatService.updateGroupAvatar(conversation.id, file);
      showStatus('Đã cập nhật ảnh đại diện nhóm.');
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      showStatus(err.message || 'Lỗi tải ảnh đại diện.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleToggleAdminsOnly = async (checked: boolean) => {
    setOnlyAdminsCanSend(checked);
    try {
      const res = await chatService.updateGroupSettings(conversation.id, {
        onlyAdminsCanSend: checked,
      });
      showStatus(checked ? 'Đã bật: Chỉ quản trị viên được nhắn tin.' : 'Đã tắt hạn chế nhắn tin.');
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      setOnlyAdminsCanSend(!checked);
      showStatus(err.message || 'Lỗi cập nhật cài đặt.', 'error');
    }
  };

  const handleToggleApproval = async (checked: boolean) => {
    setRequireJoinApproval(checked);
    try {
      const res = await chatService.updateGroupSettings(conversation.id, {
        requireJoinApproval: checked,
      });
      showStatus(checked ? 'Đã bật yêu cầu xét duyệt thành viên.' : 'Đã tắt xét duyệt thành viên.');
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      setRequireJoinApproval(!checked);
      showStatus(err.message || 'Lỗi cập nhật cài đặt.', 'error');
    }
  };

  const handleCopyInviteLink = () => {
    if (!conversation.inviteCode) return;
    const url = `${window.location.origin}/chat/invite/${conversation.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleResetInviteLink = async () => {
    setIsResettingLink(true);
    try {
      const res = await chatService.resetInviteLink(conversation.id);
      showStatus('Đã làm mới liên kết mời nhóm.');
      if (onConversationUpdated) {
        onConversationUpdated({ ...conversation, inviteCode: res.inviteCode });
      }
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi làm mới link mời.', 'error');
    } finally {
      setIsResettingLink(false);
    }
  };

  const handleMuteChange = async (hours: number | null) => {
    const mutedUntil =
      hours == null
        ? null
        : hours === -1
          ? new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000).toISOString() // forever
          : new Date(Date.now() + hours * 3600 * 1000).toISOString();

    try {
      await chatService.muteConversation(conversation.id, { mutedUntil });
      showStatus(mutedUntil ? 'Đã tắt thông báo cuộc trò chuyện.' : 'Đã bật lại thông báo.');
      if (onConversationUpdated) {
        onConversationUpdated({ ...conversation, mutedUntil });
      }
    } catch (err: any) {
      showStatus(err.message || 'Lỗi cập nhật thông báo.', 'error');
    }
  };

  const handleReviewJoin = async (requestId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await chatService.reviewJoinRequest(conversation.id, requestId, { status });
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      showStatus(status === 'Approved' ? 'Đã duyệt thành viên vào nhóm.' : 'Đã từ chối yêu cầu.');
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi xử lý yêu cầu.', 'error');
    }
  };

  const handleRoleChange = async (memberUserId: string, newRole: 'Member' | 'Admin') => {
    setActiveMenuMemberId(null);
    try {
      const res = await chatService.updateMemberRole(conversation.id, memberUserId, { role: newRole });
      showStatus(newRole === 'Admin' ? 'Đã thăng phó nhóm.' : 'Đã hạ xuống thành viên.');
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      showStatus(err.message || 'Lỗi thay đổi quyền.', 'error');
    }
  };

  const handleTransferOwnership = async (newOwnerUserId: string) => {
    setActiveMenuMemberId(null);
    if (!window.confirm('Bạn có chắc chắn muốn chuyển quyền Trưởng nhóm cho người này?')) return;
    try {
      const res = await chatService.transferOwnership(conversation.id, { newOwnerUserId });
      showStatus('Đã chuyển quyền trưởng nhóm.');
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      showStatus(err.message || 'Lỗi chuyển quyền trưởng nhóm.', 'error');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    setActiveMenuMemberId(null);
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
    try {
      const res = await chatService.removeMember(conversation.id, memberUserId);
      showStatus('Đã xóa thành viên khỏi nhóm.');
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi xóa thành viên.', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi nhóm này?')) return;
    try {
      await chatService.leaveGroup(conversation.id);
      onClose();
      if (onConversationDeleted) onConversationDeleted();
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi rời nhóm.', 'error');
    }
  };

  const handleDisbandGroup = async () => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn giải tán nhóm này? Nhóm sẽ chuyển sang chế độ chỉ đọc vĩnh viễn!')) return;
    try {
      await chatService.disbandGroup(conversation.id);
      onClose();
      if (onConversationDeleted) onConversationDeleted();
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi giải tán nhóm.', 'error');
    }
  };

  const handleSaveNickname = async () => {
    if (!nicknameModalMember) return;
    setIsSavingNickname(true);
    try {
      const res = await chatService.updateNickname(conversation.id, nicknameModalMember.userId, {
        nickname: nicknameInput.trim() || null,
      });
      showStatus('Đã cập nhật biệt danh.');
      setNicknameModalMember(null);
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi đổi biệt danh.', 'error');
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (selectedAddUserIds.length === 0) return;
    setIsAddingMembers(true);
    try {
      const res = await chatService.addMembers(conversation.id, { memberIds: selectedAddUserIds });
      showStatus('Đã gửi thêm thành viên / yêu cầu.');
      setIsAddMembersOpen(false);
      setSelectedAddUserIds([]);
      if (res.conversation && onConversationUpdated) onConversationUpdated(res.conversation);
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi thêm thành viên.', 'error');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const existingMemberIds = new Set(conversation.members.map((m) => m.userId.toLowerCase()));
  const availableToAdd = onlineFriends.filter((f) => !existingMemberIds.has(f.userId.toLowerCase()));

  const isMuted = conversation.mutedUntil && new Date(conversation.mutedUntil) > new Date();

  return (
    <div
      style={{
        width: '340px',
        borderLeft: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Thông tin hội thoại</h3>
        <Button variant="ghost" size="sm" onClick={onClose} style={{ padding: '0.25rem' }}>
          <X size={18} />
        </Button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: statusMessage.type === 'success' ? 'var(--color-success-bg, rgba(34, 197, 94, 0.1))' : 'var(--color-danger-bg)',
            color: statusMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Avatar and Group Name */}
      <div
        style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--color-border)',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <UserAvatar
            avatarUrl={conversation.avatarUrl}
            displayName={conversation.name || 'Nhóm'}
            size={70}
            clickable={false}
          />
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Đổi ảnh nhóm"
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: '2px solid var(--color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Camera size={13} />
              </button>
              <input
                type="file"
                ref={avatarFileRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>

        {isEditingName ? (
          <div style={{ width: '100%', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{
                flex: 1,
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem',
              }}
              autoFocus
            />
            <Button variant="primary" size="sm" onClick={handleSaveName} isLoading={isSavingName}>
              Lưu
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditingName(false)}>
              Hủy
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
              {conversation.name || 'Nhóm trò chuyện'}
            </h4>
            {isAdmin && (
              <button
                onClick={() => setIsEditingName(true)}
                title="Đổi tên nhóm"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <Edit2 size={15} />
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Badge variant="default">{conversation.members.length} thành viên</Badge>
          <Badge variant={isOwner ? 'primary' : isAdmin ? 'warning' : 'default'}>
            {isOwner ? 'Trưởng nhóm' : isAdmin ? 'Phó nhóm' : 'Thành viên'}
          </Badge>
        </div>
      </div>

      {/* Mute and Notification settings */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
            {isMuted ? <BellOff size={16} color="var(--color-warning, #eab308)" /> : <Bell size={16} />}
            <span>Thông báo</span>
          </div>
          {isMuted && <Badge variant="warning">Đang tắt</Badge>}
        </div>

        <select
          value={isMuted ? 'muted' : 'active'}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'active') handleMuteChange(null);
            else if (val === '1h') handleMuteChange(1);
            else if (val === '8h') handleMuteChange(8);
            else if (val === '24h') handleMuteChange(24);
            else if (val === 'forever') handleMuteChange(-1);
          }}
          style={{
            width: '100%',
            padding: '0.4rem 0.6rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        >
          <option value="active">Bật thông báo (mặc định)</option>
          <option value="1h">Tắt thông báo trong 1 giờ</option>
          <option value="8h">Tắt thông báo trong 8 giờ</option>
          <option value="24h">Tắt thông báo trong 24 giờ</option>
          <option value="forever">Tắt cho đến khi bật lại</option>
        </select>
      </div>

      {/* Invite Link */}
      {conversation.inviteCode && (
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
            Liên kết tham gia nhóm
          </span>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/chat/invite/${conversation.inviteCode}`}
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-hover)',
              }}
            />
            <Button variant="outline" size="sm" onClick={handleCopyInviteLink} title="Sao chép link">
              {copiedLink ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetInviteLink}
                isLoading={isResettingLink}
                title="Làm mới link mời"
              >
                <RefreshCw size={14} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Admin Settings Toggles */}
      {isAdmin && (
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Cài đặt quản trị nhóm
          </span>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', cursor: 'pointer' }}>
            <span>Chỉ Trưởng/Phó nhóm gửi tin</span>
            <input
              type="checkbox"
              checked={onlyAdminsCanSend}
              onChange={(e) => handleToggleAdminsOnly(e.target.checked)}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', cursor: 'pointer' }}>
            <span>Duyệt thành viên mới</span>
            <input
              type="checkbox"
              checked={requireJoinApproval}
              onChange={(e) => handleToggleApproval(e.target.checked)}
            />
          </label>
        </div>
      )}

      {/* Join Requests (if enabled and admin) */}
      {isAdmin && conversation.requireJoinApproval && (
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Yêu cầu chờ duyệt ({joinRequests.length})
            </span>
            <Button variant="ghost" size="sm" onClick={loadJoinRequests} isLoading={isLoadingRequests} style={{ padding: '0.2rem' }}>
              <RefreshCw size={12} />
            </Button>
          </div>

          {joinRequests.length === 0 ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Không có yêu cầu nào đang chờ.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.375rem',
                    backgroundColor: 'var(--color-surface-hover)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <UserAvatar avatarUrl={req.avatarUrl} displayName={req.displayName} size={28} clickable={false} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.displayName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleReviewJoin(req.id, 'Approved')}
                      title="Duyệt"
                      style={{
                        padding: '0.2rem 0.4rem',
                        backgroundColor: 'var(--color-success)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                      }}
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleReviewJoin(req.id, 'Rejected')}
                      title="Từ chối"
                      style={{
                        padding: '0.2rem 0.4rem',
                        backgroundColor: 'var(--color-danger)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                      }}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members List */}
      <div style={{ padding: '0.75rem 1rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Thành viên ({conversation.members.length})
          </span>
          <Button variant="outline" size="sm" onClick={() => setIsAddMembersOpen(true)}>
            <Plus size={14} />
            <span>Thêm</span>
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {conversation.members.map((member) => {
            const isMemberSelf = member.userId === user?.id;
            const isMemberOnline = isOnline(member.userId);
            const isMemberOwner = member.role === 'Owner';
            const isMemberAdmin = member.role === 'Admin';

            return (
              <div
                key={member.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.375rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-hover)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                  <div style={{ position: 'relative' }}>
                    <UserAvatar avatarUrl={member.avatarUrl} displayName={member.displayName} size={32} clickable={false} />
                    {isMemberOnline && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'var(--color-success)',
                          border: '1.5px solid var(--color-surface)',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.nickname || member.displayName}
                        {isMemberSelf && ' (Bạn)'}
                      </span>
                      {isMemberOwner && <span title="Trưởng nhóm"><Crown size={12} color="var(--color-primary)" /></span>}
                      {isMemberAdmin && !isMemberOwner && <span title="Phó nhóm"><Shield size={12} color="var(--color-warning, #eab308)" /></span>}
                    </div>
                    {member.nickname && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        @{member.username}
                      </span>
                    )}
                  </div>
                </div>

                {/* Member Menu Trigger */}
                <button
                  type="button"
                  onClick={() => setActiveMenuMemberId(activeMenuMemberId === member.userId ? null : member.userId)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--color-text-muted)' }}
                >
                  <MoreVertical size={16} />
                </button>

                {/* Member Dropdown Menu */}
                {activeMenuMemberId === member.userId && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '2.5rem',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 30,
                      minWidth: '170px',
                      padding: '0.25rem 0',
                    }}
                  >
                    {isMemberSelf && (
                      <button
                        onClick={() => {
                          setActiveMenuMemberId(null);
                          setNicknameModalMember(member);
                          setNicknameInput(member.nickname || '');
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8125rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Đổi biệt danh</span>
                      </button>
                    )}

                    {isOwner && !isMemberSelf && (
                      <>
                        {isMemberAdmin ? (
                          <button
                            onClick={() => handleRoleChange(member.userId, 'Member')}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.8125rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <UserMinus size={13} />
                            <span>Hạ xuống Thành viên</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(member.userId, 'Admin')}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.8125rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <Shield size={13} />
                            <span>Thăng làm Phó nhóm</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleTransferOwnership(member.userId)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8125rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <Crown size={13} />
                          <span>Chuyển quyền Trưởng nhóm</span>
                        </button>
                      </>
                    )}

                    {(isOwner || (isAdmin && !isMemberAdmin && !isMemberOwner)) && !isMemberSelf && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8125rem',
                          color: 'var(--color-danger)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <UserX size={13} />
                        <span>Xóa khỏi nhóm</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone Bottom Actions */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {isOwner ? (
          <Button variant="danger" size="sm" onClick={handleDisbandGroup} style={{ width: '100%' }}>
            <Trash2 size={15} />
            <span>Giải tán nhóm</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleLeaveGroup} style={{ width: '100%', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <LogOut size={15} />
            <span>Rời nhóm</span>
          </Button>
        )}
      </div>

      {/* Add Members Modal */}
      <Modal isOpen={isAddMembersOpen} onClose={() => setIsAddMembersOpen(false)} title="Thêm thành viên vào nhóm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Chọn từ bạn bè/danh bạ để thêm vào nhóm:
          </p>

          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
          >
            {availableToAdd.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                Tất cả bạn bè đã ở trong nhóm.
              </div>
            ) : (
              availableToAdd.map((friend) => {
                const isSelected = selectedAddUserIds.includes(friend.userId);
                return (
                  <div
                    key={friend.userId}
                    onClick={() =>
                      setSelectedAddUserIds((prev) =>
                        isSelected ? prev.filter((id) => id !== friend.userId) : [...prev, friend.userId]
                      )
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.375rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserAvatar avatarUrl={friend.avatarUrl} displayName={friend.displayName} size={30} clickable={false} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{friend.displayName}</span>
                    </div>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: isSelected ? 'none' : '1.5px solid var(--color-border-strong, #94a3b8)',
                        backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setIsAddMembersOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleAddMembersSubmit}
              isLoading={isAddingMembers}
              disabled={selectedAddUserIds.length === 0 || isAddingMembers}
            >
              Thêm ({selectedAddUserIds.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Nickname Modal */}
      <Modal
        isOpen={!!nicknameModalMember}
        onClose={() => setNicknameModalMember(null)}
        title="Đổi biệt danh trong nhóm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Biệt danh mới"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            placeholder="Để trống để dùng tên hiển thị tài khoản"
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setNicknameModalMember(null)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSaveNickname} isLoading={isSavingNickname}>
              Lưu biệt danh
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
