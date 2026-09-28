import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, MessageSquare, Plus, Send, AlertCircle, AtSign } from 'lucide-react';
import { useConversationMessages, useConversations } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/api/services';
import { chatHubClient } from '../../services/signalr/chatHubClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { UserAvatar } from '../../components/common/UserAvatar';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime } from '../../utils/formatters';

const DEFAULT_SYSTEM_ACCOUNTS = [
  { username: 'shopowner1', displayName: 'Shop Owner', role: 'ShopOwner', id: '5c800801-3f2d-4c03-9e4d-8d37fe7da4db' },
  { username: 'user1', displayName: 'Regular User', role: 'User', id: 'd00476d1-378e-4776-94ec-6f9f753a817c' },
  { username: 'shipper1', displayName: 'Shipper', role: 'Shipper', id: '065271b3-2c39-4c7e-8183-51627410672f' },
  { username: 'admin', displayName: 'Administrator', role: 'Admin', id: '35ccfee2-b164-48ed-ba78-6fcdec7914d2' },
];

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, isLoading: isConvLoading, createConversation } = useConversations();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const [isSignalRConnected, setIsSignalRConnected] = useState(chatHubClient.isConnected());

  useEffect(() => {
    setIsSignalRConnected(chatHubClient.isConnected());
    const unsub = chatHubClient.subscribe({
      onConnectionStatusChanged: (connected) => {
        setIsSignalRConnected(connected);
      },
    });
    return unsub;
  }, []);

  // Scroll and presence management
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const prevMessagesCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Auto select first conversation if available and none selected
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  const {
    messages,
    isLoading: isMsgLoading,
    sendMessage,
    isSending,
    markRead,
    loadOlderMessages,
    hasOlderMessages,
    isLoadingOlder,
  } = useConversationMessages(selectedConvId || undefined);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewMessagesBelow(false);
    isNearBottomRef.current = true;
  };

  // Detect scroll position to check if user is near bottom
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 150;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom <= threshold;
    isNearBottomRef.current = near;
    if (near) {
      setHasNewMessagesBelow(false);
    }
  };

  // Reset scroll and new-message indicator on conversation switch
  useEffect(() => {
    setHasNewMessagesBelow(false);
    isNearBottomRef.current = true;
    isInitialLoadRef.current = true;
    prevMessagesCountRef.current = 0;
  }, [selectedConvId]);

  // Handle auto-scroll or unread indicator when messages update
  useLayoutEffect(() => {
    if (!messages || messages.length === 0) {
      prevMessagesCountRef.current = 0;
      return;
    }

    const prevCount = prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    // Initial conversation load: jump directly to bottom
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      scrollToBottom('auto');
      return;
    }

    // If new message was added at the bottom
    if (messages.length > prevCount) {
      const lastMsg = messages[messages.length - 1];
      const isMine = lastMsg.senderId === user?.id;

      if (isMine || isNearBottomRef.current) {
        scrollToBottom('smooth');
        if (!isMine && selectedConvId) {
          markRead(lastMsg.id).catch(() => {});
        }
      } else {
        // User is viewing older history: show indicator
        setHasNewMessagesBelow(true);
      }
    }
  }, [messages, user?.id, selectedConvId, markRead]);

  // Handle loading older messages with scroll position retention
  const handleLoadOlder = async () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const previousScrollHeight = el.scrollHeight;
    const previousScrollTop = el.scrollTop;

    await loadOlderMessages();

    // Preserve scroll position so viewport doesn't jump
    requestAnimationFrame(() => {
      if (el) {
        const heightDifference = el.scrollHeight - previousScrollHeight;
        el.scrollTop = previousScrollTop + heightDifference;
      }
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;

    const text = messageInput.trim();
    setMessageInput('');
    try {
      await sendMessage({ content: text });
      scrollToBottom('smooth');
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi tin nhắn.');
    }
  };

  const handleStartNewChat = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const raw = (directInput ?? targetInput).trim();
    if (!raw) return;

    setNewChatError(null);
    setIsSearchingUser(true);

    try {
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
      let participantId = raw;

      if (!isGuid) {
        const cleanUsername = raw.replace(/^@/, '').trim().toLowerCase();

        // Check if self
        if (cleanUsername === user?.username.toLowerCase()) {
          setNewChatError('Bạn không thể tạo cuộc trò chuyện với chính mình.');
          setIsSearchingUser(false);
          return;
        }

        // Check known default accounts
        const seed = DEFAULT_SYSTEM_ACCOUNTS.find(
          (u) => u.username.toLowerCase() === cleanUsername
        );

        if (seed) {
          participantId = seed.id;
        } else {
          // Look up user via API
          try {
            const found = await userService.getByUsername(cleanUsername);
            if (found?.id) {
              participantId = found.id;
            } else {
              throw new Error();
            }
          } catch {
            setNewChatError(`Không tìm thấy người dùng với tài khoản "@${cleanUsername}".`);
            setIsSearchingUser(false);
            return;
          }
        }
      }

      if (user?.id && participantId.toLowerCase() === user.id.toLowerCase()) {
        setNewChatError('Bạn không thể tạo cuộc trò chuyện với chính mình.');
        setIsSearchingUser(false);
        return;
      }

      const conv = await createConversation(participantId);
      setIsNewChatModalOpen(false);
      setTargetInput('');
      setNewChatError(null);
      setSelectedConvId(conv.id);
    } catch (err: any) {
      setNewChatError(err.response?.data?.message || err.message || 'Không thể tạo cuộc trò chuyện.');
    } finally {
      setIsSearchingUser(false);
    }
  };

  const currentConv = conversations.find((c) => c.id === selectedConvId);
  const otherMember = currentConv?.members.find((m) => m.userId !== user?.id) || currentConv?.members[0];

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - var(--header-height) - 3rem)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Left Sidebar: Conversation List */}
      <div
        style={{
          width: '320px',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Trò chuyện (SignalR)</h3>
          <Button variant="primary" size="sm" onClick={() => setIsNewChatModalOpen(true)} title="Tạo chat mới">
            <Plus size={16} />
          </Button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {isConvLoading && <LoadingState message="Đang tải..." />}

          {!isConvLoading && conversations.length === 0 && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Chưa có cuộc trò chuyện nào. Bấm nút '+' để bắt đầu!
            </div>
          )}

          {!isConvLoading &&
            conversations.map((conv) => {
              const partner = conv.members.find((m) => m.userId !== user?.id) || conv.members[0];
              const isSelected = conv.id === selectedConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    transition: 'background-color 0.1s ease',
                  }}
                >
                  <UserAvatar
                    avatarUrl={partner?.avatarUrl}
                    displayName={partner?.displayName || 'Chat'}
                    size={40}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {partner?.displayName || 'Người dùng'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage?.content || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Right Thread: Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)', position: 'relative' }}>
        {selectedConvId && currentConv ? (
          <>
            {/* Thread Header with partner identity link */}
            <div
              style={{
                height: '60px',
                padding: '0 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                onClick={() => {
                  if (otherMember?.userId) {
                    navigate(`/users/${otherMember.userId}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: otherMember?.userId ? 'pointer' : 'default',
                }}
                title={otherMember?.userId ? `Xem hồ sơ của ${otherMember.displayName}` : undefined}
              >
                <UserAvatar
                  avatarUrl={otherMember?.avatarUrl}
                  displayName={otherMember?.displayName || 'User'}
                  size={36}
                  clickable={false}
                />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    {otherMember?.displayName || 'Cuộc trò chuyện'}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: isSignalRConnected ? 'var(--color-success)' : 'var(--color-warning, #eab308)',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>{isSignalRConnected ? '●' : '○'}</span>
                    <span>{isSignalRConnected ? 'Đã kết nối Realtime' : 'Đang kết nối lại...'}</span>
                  </span>
                </div>
              </div>

              {otherMember?.userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/users/${otherMember.userId}`)}
                >
                  Xem hồ sơ
                </Button>
              )}
            </div>

            {/* Messages Feed Container (Oldest at top, Newest at bottom) */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {/* Load Older Messages button if available */}
              {hasOlderMessages && (
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadOlder}
                    isLoading={isLoadingOlder}
                  >
                    Tải tin nhắn cũ hơn
                  </Button>
                </div>
              )}

              {isMsgLoading && <LoadingState message="Đang tải tin nhắn..." />}

              {!isMsgLoading && messages.length === 0 && (
                <EmptyState
                  icon={<MessageSquare size={32} />}
                  title="Bắt đầu trò chuyện"
                  description="Gửi tin nhắn đầu tiên để kết nối với đối phương!"
                />
              )}

              {!isMsgLoading &&
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '0.625rem 0.875rem',
                          borderRadius: isMine
                            ? 'var(--radius-lg) var(--radius-lg) 2px var(--radius-lg)'
                            : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 2px',
                          backgroundColor: isMine ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: isMine ? '#ffffff' : 'var(--color-text)',
                          boxShadow: 'var(--shadow-sm)',
                          fontSize: '0.9375rem',
                          wordBreak: 'break-word',
                          fontStyle: msg.isDeleted ? 'italic' : 'normal',
                          opacity: msg.isDeleted ? 0.75 : 1,
                        }}
                      >
                        {msg.isDeleted ? 'Tin nhắn đã bị thu hồi' : msg.content}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating "Tin nhắn mới ↓" Button when scrolled up */}
            {hasNewMessagesBelow && (
              <button
                onClick={() => scrollToBottom('smooth')}
                style={{
                  position: 'absolute',
                  bottom: '75px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 20,
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                }}
              >
                <ArrowDown size={16} />
                <span>Tin nhắn mới ↓</span>
              </button>
            )}

            {/* Message Composer fixed at bottom */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '1rem',
                backgroundColor: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontSize: '0.9375rem',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                }}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!messageInput.trim() || isSending}
                style={{ borderRadius: 'var(--radius-full)', width: '40px', height: '40px', padding: 0 }}
              >
                <Send size={18} />
              </Button>
            </form>
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare size={36} />}
            title="Chọn một cuộc trò chuyện"
            description="Chọn từ danh sách bên trái hoặc tạo cuộc trò chuyện mới để bắt đầu chat thời gian thực."
          />
        )}
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => {
          setIsNewChatModalOpen(false);
          setNewChatError(null);
        }}
        title="Bắt đầu trò chuyện mới"
      >
        <form onSubmit={(e) => handleStartNewChat(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            Nhập tên tài khoản (ví dụ: <strong style={{ color: 'var(--color-primary)' }}>@shopowner1</strong> hoặc <strong>user1</strong>) hoặc mã User ID (dạng GUID) để bắt đầu nhắn tin:
          </p>

          <Input
            label="Tên tài khoản (@username) hoặc Mã User ID"
            value={targetInput}
            onChange={(e) => {
              setTargetInput(e.target.value);
              if (newChatError) setNewChatError(null);
            }}
            placeholder="Ví dụ: @shopowner1, user1 hoặc GUID..."
            required
            autoFocus
          />

          {newChatError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 0.75rem',
                backgroundColor: 'var(--color-error-light, #fee2e2)',
                color: 'var(--color-error, #dc2626)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{newChatError}</span>
            </div>
          )}

          {/* Quick Suggestions */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Gợi ý tài khoản nhanh:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {DEFAULT_SYSTEM_ACCOUNTS.filter(
                (acc) => acc.username.toLowerCase() !== user?.username.toLowerCase()
              ).map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setTargetInput(`@${acc.username}`);
                    handleStartNewChat(undefined, `@${acc.username}`);
                  }}
                  disabled={isSearchingUser}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-hover)',
                    color: 'var(--color-text)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <AtSign size={13} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600 }}>{acc.username}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({acc.displayName})</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsNewChatModalOpen(false);
                setNewChatError(null);
              }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSearchingUser}
              disabled={!targetInput.trim() || isSearchingUser}
            >
              Bắt đầu chat
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
