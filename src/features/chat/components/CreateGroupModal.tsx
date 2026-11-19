import React, { useRef, useState } from 'react';
import { Camera, Users, Check } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { usePresence } from '../../../hooks/usePresence';
import { chatService } from '../../../services/api/services';
import type { ConversationDto } from '../../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newConv: ConversationDto) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const { onlineFriends } = usePresence();
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [requireJoinApproval, setRequireJoinApproval] = useState(false);
  const [onlyAdminsCanSend, setOnlyAdminsCanSend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setErrorMessage('Vui lòng nhập tên nhóm.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const conv = await chatService.createGroup({
        name: groupName.trim(),
        memberIds: selectedUserIds,
        requireJoinApproval,
        onlyAdminsCanSend,
      });

      if (avatarFile) {
        try {
          await chatService.updateGroupAvatar(conv.id, avatarFile);
        } catch (avatarErr) {
          console.warn('Failed to upload group avatar:', avatarErr);
        }
      }

      onGroupCreated(conv);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Lỗi khi tạo nhóm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUserIds([]);
    setAvatarFile(null);
    setAvatarPreview(null);
    setRequireJoinApproval(false);
    setOnlyAdminsCanSend(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo nhóm trò chuyện mới">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {errorMessage && (
          <div
            style={{
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Group Avatar and Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: 'var(--color-surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--color-border)',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Users size={28} color="var(--color-text-muted)" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Camera size={12} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <Input
              label="Tên nhóm"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              required
              autoFocus
            />
          </div>
        </div>

        {/* Member Selection from Online Friends */}
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Thêm thành viên ({selectedUserIds.length} đã chọn)
          </label>
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
          >
            {onlineFriends.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                Chưa có liên hệ nào trong danh bạ để thêm.
              </div>
            ) : (
              onlineFriends.map((friend) => {
                const isSelected = selectedUserIds.includes(friend.userId);
                return (
                  <div
                    key={friend.userId}
                    onClick={() => toggleUserSelection(friend.userId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.375rem 0.625rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <UserAvatar avatarUrl={friend.avatarUrl} displayName={friend.displayName} size={32} clickable={false} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{friend.displayName}</span>
                    </div>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: isSelected ? 'none' : '1.5px solid var(--color-border-strong, #94a3b8)',
                        backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Group Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={requireJoinApproval}
              onChange={(e) => setRequireJoinApproval(e.target.checked)}
            />
            <span>Duyệt thành viên trước khi vào nhóm</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyAdminsCanSend}
              onChange={(e) => setOnlyAdminsCanSend(e.target.checked)}
            />
            <span>Chỉ Trưởng/Phó nhóm được gửi tin nhắn</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Button variant="ghost" type="button" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={isSubmitting || !groupName.trim()}>
            Tạo nhóm
          </Button>
        </div>
      </form>
    </Modal>
  );
};
