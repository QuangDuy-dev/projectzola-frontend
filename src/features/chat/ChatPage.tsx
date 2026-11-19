import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  MessageSquare,
  Plus,
  Send,
  AlertCircle,
  AtSign,
  Info,
  Users,
  Pin,
  Reply,
  Smile,
  Trash2,
  Camera,
  Image as ImageIcon,
  Mic,
  BarChart2,
  BellOff,
  ChevronLeft,
} from 'lucide-react';
import { useConversationMessages, useConversations, usePinnedMessages } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { chatService, userService } from '../../services/api/services';
import { chatHubClient } from '../../services/signalr/chatHubClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { UserAvatar } from '../../components/common/UserAvatar';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { usePresence } from '../../hooks/usePresence';
import { OnlineFriendsBar } from './components/OnlineFriendsBar';
import { CreateGroupModal } from './components/CreateGroupModal';
import { GroupInfoPanel } from './components/GroupInfoPanel';
import { PinnedMessagesBar } from './components/PinnedMessagesBar';
import { ReplyPreviewBar } from './components/ReplyPreviewBar';
import { MessageReactionsRow, QuickReactionPicker } from './components/MessageReactionsRow';
import { MentionSuggestionsPopup } from './components/MentionSuggestionsPopup';
import { AttachmentPicker } from './components/AttachmentPicker';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { MediaGrid } from './components/MediaGrid';
import { VoiceRecorderBar } from './components/VoiceRecorderBar';
import { VoiceMessageBubble } from './components/VoiceMessageBubble';
import { CreatePollModal } from './components/CreatePollModal';
import { PollBubble } from './components/PollBubble';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { validateMediaFiles } from '../../utils/chatMediaHelper';
import {
  getMentionQuery,
  getMentionSuggestions,
  insertMention,
  type MentionSuggestion,
} from '../../utils/mentionHelper';
import { canUserSendMessage, applyPollUpdate } from '../../utils/chatReducers';
import type { MessageDto, CreatePollRequest } from '../../types';

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
  const { isOnline, getLastSeen } = usePresence();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const [isSignalRConnected, setIsSignalRConnected] = useState(chatHubClient.isConnected());
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    deleteMessage,
    isSending,
    markRead,
    loadOlderMessages,
    hasOlderMessages,
    isLoadingOlder,
  } = useConversationMessages(selectedConvId || undefined);

  const { pinnedMessages, unpinMessage, pinMessage } = usePinnedMessages(selectedConvId || undefined);

  // M4 state: reply, hover, reaction picker, mentions
  const [replyingToMessage, setReplyingToMessage] = useState<MessageDto | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<string | null>(null);
  const [mentionMatch, setMentionMatch] = useState<{ isMentioning: boolean; query: string; startIndex: number } | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionAll, setMentionAll] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  // M5 state: attachments, camera capture, upload progress
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // M6 state: voice message recording
  const [isVoiceRecordingActive, setIsVoiceRecordingActive] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const {
    recordingSeconds,
    liveWaveform,
    error: voiceRecorderError,
    startRecording: startVoiceRecording,
    stopRecording: stopVoiceRecording,
    cancelRecording: cancelVoiceRecording,
  } = useVoiceRecorder();

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewMessagesBelow(false);
    isNearBottomRef.current = true;
  };

  // Jump to specific message with highlight animation
  const handleJumpToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background-color 0.4s ease';
      el.style.backgroundColor = 'var(--color-primary-light, rgba(59, 130, 246, 0.15))';
      setTimeout(() => {
        el.style.backgroundColor = 'transparent';
      }, 1400);
    }
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

  // Reset scroll and M4/M5/M6 states on conversation switch
  useEffect(() => {
    setHasNewMessagesBelow(false);
    isNearBottomRef.current = true;
    isInitialLoadRef.current = true;
    prevMessagesCountRef.current = 0;
    setReplyingToMessage(null);
    setHoveredMessageId(null);
    setActiveReactionPickerMessageId(null);
    setMentionMatch(null);
    setMentionedUserIds([]);
    setMentionAll(false);
    setSelectedFiles([]);
    setUploadProgress(null);
    setUploadError(null);
    setIsUploadingMedia(false);
    if (isVoiceRecordingActive) {
      cancelVoiceRecording();
      setIsVoiceRecordingActive(false);
    }
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

  const currentConv = conversations.find((c) => c.id === selectedConvId);
  const otherMember = currentConv?.members.find((m) => m.userId !== user?.id) || currentConv?.members[0];

  const mentionSuggestions =
    mentionMatch && mentionMatch.isMentioning && currentConv?.type === 'Group' && currentConv.members
      ? getMentionSuggestions(currentConv.members, mentionMatch.query, true)
      : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageInput(val);
    const cursor = e.target.selectionStart ?? val.length;
    if (currentConv?.type === 'Group') {
      const match = getMentionQuery(val, cursor);
      setMentionMatch(match);
    } else {
      setMentionMatch(null);
    }
  };

  const handleSelectMention = (suggestion: MentionSuggestion) => {
    if (!mentionMatch) return;
    const { newText, newCursor } = insertMention(
      messageInput,
      mentionMatch.startIndex,
      mentionMatch.query.length,
      suggestion
    );
    setMessageInput(newText);
    if (suggestion.isAll || suggestion.id === 'ALL') {
      setMentionAll(true);
    } else {
      setMentionedUserIds((prev) => Array.from(new Set([...prev, suggestion.id])));
    }
    setMentionMatch(null);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) return;
    e.target.value = '';

    const newCombined = [...selectedFiles, ...chosen];
    const validation = validateMediaFiles(newCombined);
    if (!validation.valid) {
      const standalone = validateMediaFiles(chosen);
      if (!standalone.valid) {
        alert(standalone.error);
        return;
      }
      setSelectedFiles(chosen);
    } else {
      setSelectedFiles(newCombined);
    }
    setUploadError(null);
  };

  const handleCaptureCamera = (file: File) => {
    const newCombined = [...selectedFiles, file];
    const validation = validateMediaFiles(newCombined);
    if (!validation.valid) {
      const standalone = validateMediaFiles([file]);
      if (!standalone.valid) {
        alert(standalone.error);
        return;
      }
      setSelectedFiles([file]);
    } else {
      setSelectedFiles(newCombined);
    }
    setUploadError(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId) return;

    const text = messageInput.trim();
    if (!text && selectedFiles.length === 0) return;

    const replyId = replyingToMessage?.id;
    const uids = mentionedUserIds.length > 0 ? [...mentionedUserIds] : undefined;
    const all = mentionAll;

    if (selectedFiles.length > 0) {
      setIsUploadingMedia(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        const sentMessage = await chatService.sendMediaMessage(
          selectedConvId,
          selectedFiles,
          {
            content: text || undefined,
            replyToMessageId: replyId,
            mentionedUserIds: uids,
            mentionAll: all ? true : undefined,
          },
          (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          }
        );

        queryClient.setQueryData(['messages', selectedConvId], (old: any) => {
          if (!old) return { items: [sentMessage], totalCount: 1, page: 1, totalPages: 1 };
          const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === sentMessage.id.toLowerCase());
          if (exists) return old;
          return {
            ...old,
            items: [...old.items, sentMessage],
            totalCount: (old.totalCount ?? old.items.length) + 1,
          };
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        setMessageInput('');
        setSelectedFiles([]);
        setUploadProgress(null);
        setUploadError(null);
        setReplyingToMessage(null);
        setMentionMatch(null);
        setMentionedUserIds([]);
        setMentionAll(false);
        scrollToBottom('smooth');
      } catch (err: any) {
        console.error('Lỗi tải tệp lên:', err);
        setUploadError(err?.response?.data?.message || err.message || 'Lỗi tải tệp lên. Vui lòng thử lại.');
      } finally {
        setIsUploadingMedia(false);
      }
      return;
    }

    // Text-only message
    setMessageInput('');
    setReplyingToMessage(null);
    setMentionMatch(null);
    setMentionedUserIds([]);
    setMentionAll(false);

    try {
      await sendMessage({
        content: text,
        replyToMessageId: replyId,
        mentionedUserIds: uids,
        mentionAll: all ? true : undefined,
      });
      scrollToBottom('smooth');
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi tin nhắn.');
    }
  };

  const handleRetryUpload = () => {
    handleSendMessage({ preventDefault: () => {} } as any);
  };

  const handleStartVoice = async () => {
    setIsVoiceRecordingActive(true);
    await startVoiceRecording();
  };

  const handleCancelVoice = () => {
    cancelVoiceRecording();
    setIsVoiceRecordingActive(false);
  };

  const handleSendVoice = async () => {
    if (!selectedConvId) return;
    setIsSendingVoice(true);
    try {
      const recorded = await stopVoiceRecording();
      if (recorded) {
        const replyId = replyingToMessage?.id;
        const sentMsg = await chatService.sendVoiceMessage(
          selectedConvId,
          recorded.audioBlob,
          {
            durationSeconds: recorded.durationSeconds,
            waveformJson: recorded.waveformJson,
            replyToMessageId: replyId,
          }
        );

        queryClient.setQueryData(['messages', selectedConvId], (old: any) => {
          if (!old) return { items: [sentMsg], totalCount: 1, page: 1, totalPages: 1 };
          const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === sentMsg.id.toLowerCase());
          if (exists) return old;
          return {
            ...old,
            items: [...old.items, sentMsg],
            totalCount: (old.totalCount ?? old.items.length) + 1,
          };
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        setReplyingToMessage(null);
        setIsVoiceRecordingActive(false);
        scrollToBottom('smooth');
      }
    } catch (err: any) {
      console.error('Lỗi gửi tin nhắn thoại:', err);
      alert(err?.response?.data?.message || err.message || 'Lỗi gửi tin nhắn thoại.');
    } finally {
      setIsSendingVoice(false);
    }
  };

  const handleCreatePoll = async (data: CreatePollRequest) => {
    if (!selectedConvId) return;
    const sentMsg = await chatService.createPoll(selectedConvId, data);
    queryClient.setQueryData(['messages', selectedConvId], (old: any) => {
      if (!old) return { items: [sentMsg], totalCount: 1, page: 1, totalPages: 1 };
      const exists = old.items.some((m: MessageDto) => m.id.toLowerCase() === sentMsg.id.toLowerCase());
      if (exists) return old;
      return {
        ...old,
        items: [...old.items, sentMsg],
        totalCount: (old.totalCount ?? old.items.length) + 1,
      };
    });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    scrollToBottom('smooth');
  };

  const handleVotePoll = async (pollId: string, optionIds: string[]) => {
    if (!selectedConvId) return;
    const updated = await chatService.votePoll(selectedConvId, pollId, { optionIds });
    queryClient.setQueryData(['messages', selectedConvId], (old: any) => {
      if (!old?.items) return old;
      return {
        ...old,
        items: applyPollUpdate(old.items, updated),
      };
    });
  };

  const handleClosePoll = async (pollId: string) => {
    if (!selectedConvId) return;
    const updated = await chatService.closePoll(selectedConvId, pollId);
    queryClient.setQueryData(['messages', selectedConvId], (old: any) => {
      if (!old?.items) return old;
      return {
        ...old,
        items: applyPollUpdate(old.items, updated),
      };
    });
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!selectedConvId) return;
    setActiveReactionPickerMessageId(null);
    try {
      await chatService.toggleReaction(selectedConvId, messageId, { emoji });
    } catch (err: any) {
      console.error('Lỗi thả cảm xúc:', err);
    }
  };

  const handleTogglePin = async (msg: MessageDto) => {
    if (!selectedConvId) return;
    try {
      if (msg.isPinned) {
        await unpinMessage(msg.id);
      } else {
        await pinMessage(msg.id);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Lỗi thao tác ghim tin nhắn.');
    }
  };

  const handleDeleteMessage = async (msg: MessageDto) => {
    if (!selectedConvId || msg.senderId !== user?.id || msg.isDeleted) return;
    if (window.confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) {
      try {
        await deleteMessage(msg.id);
      } catch (err: any) {
        alert(err?.response?.data?.message || err.message || 'Lỗi thu hồi tin nhắn.');
      }
    }
  };

  const renderMessageContent = (content: string, isMine: boolean) => {
    if (!content) return null;
    const mentionPattern = /(@Tất cả|@All|@[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g;
    const parts = content.split(mentionPattern);
    if (parts.length === 1) return content;

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            style={{
              fontWeight: 700,
              color: isMine ? '#dbeafe' : 'var(--color-primary)',
              backgroundColor: isMine ? 'rgba(255, 255, 255, 0.2)' : 'var(--color-primary-light, rgba(59, 130, 246, 0.1))',
              borderRadius: '3px',
              padding: '1px 3px',
              display: 'inline-block',
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
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
          width: isMobile ? '100%' : '320px',
          borderRight: isMobile ? 'none' : '1px solid var(--color-border)',
          display: isMobile && selectedConvId ? 'none' : 'flex',
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
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Trò chuyện</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateGroupModalOpen(true)}
              title="Tạo nhóm trò chuyện"
            >
              <Users size={15} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewChatModalOpen(true)}
              title="Tạo chat 1-1"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        <OnlineFriendsBar onSelectUser={(uid) => handleStartNewChat(undefined, uid)} />

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
              const isPartnerOnline = partner?.userId ? isOnline(partner.userId) : false;

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
                  <div style={{ position: 'relative' }}>
                    <UserAvatar
                      avatarUrl={partner?.avatarUrl}
                      displayName={partner?.displayName || 'Chat'}
                      size={40}
                    />
                    {isPartnerOnline && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '10px',
                          height: '10px',
                          backgroundColor: 'var(--color-success, #22c55e)',
                          border: '2px solid var(--color-surface)',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {conv.type === 'Group'
                            ? conv.name || 'Nhóm trò chuyện'
                            : partner?.displayName || 'Người dùng'}
                        </span>
                        {conv.mutedUntil && new Date(conv.mutedUntil) > new Date() && (
                          <span title="Đã tắt thông báo" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                            <BellOff size={13} color="var(--color-text-muted)" />
                          </span>
                        )}
                      </div>
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
      <div
        style={{
          flex: 1,
          display: isMobile && !selectedConvId ? 'none' : 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-background)',
          position: 'relative',
        }}
      >
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setSelectedConvId(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--color-text)',
                    }}
                    title="Quay lại danh sách"
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}
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
                <div style={{ position: 'relative' }}>
                  <UserAvatar
                    avatarUrl={otherMember?.avatarUrl}
                    displayName={otherMember?.displayName || 'User'}
                    size={36}
                    clickable={false}
                  />
                  {otherMember?.userId && isOnline(otherMember.userId) && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '9px',
                        height: '9px',
                        backgroundColor: 'var(--color-success, #22c55e)',
                        border: '2px solid var(--color-surface)',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    {currentConv?.type === 'Group'
                      ? currentConv.name || 'Nhóm trò chuyện'
                      : otherMember?.displayName || 'Cuộc trò chuyện'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                      <span>{isSignalRConnected ? 'Realtime' : 'Đang kết nối lại...'}</span>
                    </span>
                    {currentConv?.type !== 'Group' && otherMember?.userId && (
                      <span style={{ fontSize: '0.6875rem', color: isOnline(otherMember.userId) ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {isOnline(otherMember.userId)
                          ? '• Đang hoạt động'
                          : getLastSeen(otherMember.userId)
                            ? `• Hoạt động ${formatRelativeTime(getLastSeen(otherMember.userId))}`
                            : '• Ngoại tuyến'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {currentConv?.type === 'Group' ? (
                  <Button
                    variant={isGroupInfoOpen ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setIsGroupInfoOpen(!isGroupInfoOpen)}
                    title="Thông tin nhóm"
                  >
                    <Info size={16} />
                    <span>Chi tiết</span>
                  </Button>
                ) : (
                  otherMember?.userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/users/${otherMember.userId}`)}
                    >
                      Xem hồ sơ
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Pinned Messages Bar */}
            {pinnedMessages && pinnedMessages.length > 0 && (
              <PinnedMessagesBar
                pinnedMessages={pinnedMessages}
                onScrollToMessage={handleJumpToMessage}
                onUnpin={(msgId) => unpinMessage(msgId)}
                canUnpin={true}
              />
            )}

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
                  if (msg.type === 'System') {
                    return (
                      <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          margin: '0.5rem 0',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            backgroundColor: 'var(--color-surface-hover)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--color-border)',
                            fontStyle: 'italic',
                            maxWidth: '85%',
                            textAlign: 'center',
                          }}
                        >
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  const isMine = msg.senderId === user?.id;
                  const isHovered = hoveredMessageId === msg.id;
                  const isPickerActive = activeReactionPickerMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      onMouseEnter={() => setHoveredMessageId(msg.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        position: 'relative',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      {/* Floating action bar on hover */}
                      {(isHovered || isPickerActive) && !msg.isDeleted && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-14px',
                            [isMine ? 'right' : 'left']: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-full)',
                            boxShadow: 'var(--shadow-md)',
                            padding: '2px 4px',
                            gap: '2px',
                            zIndex: 15,
                          }}
                        >
                          {/* Quick Reaction toggle button */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReactionPickerMessageId(isPickerActive ? null : msg.id)
                            }
                            title="Thả cảm xúc"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-text-muted)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                          >
                            <Smile size={15} />
                          </button>

                          {/* Reply button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToMessage(msg);
                              inputRef.current?.focus();
                            }}
                            title="Trả lời"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-text-muted)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                          >
                            <Reply size={15} />
                          </button>

                          {/* Pin / Unpin button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePin(msg)}
                            title={msg.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: msg.isPinned ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = msg.isPinned
                                ? 'var(--color-primary)'
                                : 'var(--color-text-muted)')
                            }
                          >
                            <Pin size={15} fill={msg.isPinned ? 'currentColor' : 'none'} />
                          </button>

                          {/* Delete / Revoke message (only for sender if not deleted) */}
                          {isMine && !msg.isDeleted && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg)}
                              title="Thu hồi tin nhắn"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-muted)',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error, #dc2626)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Reaction picker popup */}
                      {isPickerActive && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-48px',
                            [isMine ? 'right' : 'left']: '12px',
                            zIndex: 30,
                          }}
                        >
                          <QuickReactionPicker
                            onSelectEmoji={(emoji) => handleToggleReaction(msg.id, emoji)}
                          />
                        </div>
                      )}

                      {/* Sender name for group chat when not mine */}
                      {!isMine && currentConv?.type === 'Group' && (msg.senderDisplayName || msg.senderUsername) && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            marginBottom: '2px',
                            marginLeft: '4px',
                          }}
                        >
                          {msg.senderDisplayName || msg.senderUsername}
                        </span>
                      )}

                      {/* Bubble body */}
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
                          position: 'relative',
                        }}
                      >
                        {/* Quote reply block if replyTo exists */}
                        {msg.replyTo && (
                          <div
                            onClick={() => handleJumpToMessage(msg.replyTo!.id)}
                            style={{
                              borderLeft: `3px solid ${isMine ? 'rgba(255,255,255,0.7)' : 'var(--color-primary)'}`,
                              paddingLeft: '0.5rem',
                              marginBottom: '0.375rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              opacity: 0.9,
                              backgroundColor: isMine ? 'rgba(0,0,0,0.1)' : 'var(--color-surface-hover)',
                              borderRadius: '0 4px 4px 0',
                              padding: '0.25rem 0.5rem',
                            }}
                            title="Bấm để cuộn đến tin nhắn gốc"
                          >
                            <div style={{ fontWeight: 600 }}>
                              {msg.replyTo.senderDisplayName || msg.replyTo.senderUsername || 'Tin nhắn'}
                            </div>
                            <div
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '240px',
                              }}
                            >
                              {msg.replyTo.content || '[Nội dung]'}
                            </div>
                          </div>
                        )}

                        {(() => {
                          const audioAtt = msg.attachments?.find(
                            (a) => a.attachmentType === 'Audio' || a.mimeType?.startsWith('audio/')
                          );
                          const nonAudioAtts = msg.attachments?.filter(
                            (a) => a.attachmentType !== 'Audio' && !a.mimeType?.startsWith('audio/')
                          );

                          return (
                            <>
                              {audioAtt && (
                                <div style={{ marginBottom: msg.content ? '0.375rem' : 0 }}>
                                  <VoiceMessageBubble attachment={audioAtt} isMine={isMine} />
                                </div>
                              )}
                              {nonAudioAtts && nonAudioAtts.length > 0 && (
                                <div style={{ marginBottom: msg.content ? '0.5rem' : 0 }}>
                                  <MediaGrid attachments={nonAudioAtts} isMine={isMine} />
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {msg.poll && (
                          <div style={{ marginBottom: msg.content ? '0.5rem' : 0 }}>
                            <PollBubble
                              poll={msg.poll}
                              currentUserId={user?.id}
                              canClosePoll={
                                msg.poll.createdById === user?.id ||
                                currentConv?.members.find((m) => m.userId === user?.id)?.role === 'Admin' ||
                                currentConv?.members.find((m) => m.userId === user?.id)?.role === 'Owner'
                              }
                              onVote={(optionIds) => handleVotePoll(msg.poll!.id, optionIds)}
                              onClosePoll={() => handleClosePoll(msg.poll!.id)}
                            />
                          </div>
                        )}

                        {msg.content && (
                          <div>{msg.isDeleted ? 'Tin nhắn đã bị thu hồi' : renderMessageContent(msg.content, isMine)}</div>
                        )}

                        {msg.isDeleted && !msg.content && (
                          <div><em>Tin nhắn đã bị thu hồi</em></div>
                        )}
                      </div>

                      {/* Reactions row */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <MessageReactionsRow
                            reactions={msg.reactions}
                            isMine={isMine}
                            onToggleReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
                          />
                        </div>
                      )}

                      {/* Timestamp and Pinned badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                        {msg.isPinned && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.625rem',
                              color: 'var(--color-primary)',
                              fontWeight: 600,
                            }}
                          >
                            <Pin size={10} fill="currentColor" />
                            <span>Đã ghim</span>
                          </span>
                        )}
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
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

            {/* Message Composer / Restriction banner */}
            {(() => {
              const sendPermission = canUserSendMessage(currentConv, user?.id);
              if (!sendPermission.canSend) {
                return (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--color-surface)',
                      borderTop: '1px solid var(--color-border)',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: sendPermission.reason === 'disbanded' ? 'var(--color-text-muted)' : 'var(--color-warning, #eab308)',
                      fontStyle: sendPermission.reason === 'disbanded' ? 'italic' : 'normal',
                      fontWeight: sendPermission.reason === 'admin_only' ? 500 : 400,
                    }}
                  >
                    {sendPermission.reason === 'disbanded'
                      ? 'Nhóm này đã giải tán (Chế độ chỉ đọc)'
                      : 'Chỉ trưởng/phó nhóm mới được gửi tin nhắn trong nhóm này'}
                  </div>
                );
              }

              return (
                <div style={{ position: 'relative' }}>
                  {/* Mention Suggestions Popup */}
                  <MentionSuggestionsPopup
                    isOpen={mentionSuggestions.length > 0 && !!mentionMatch}
                    suggestions={mentionSuggestions}
                    onSelect={handleSelectMention}
                  />

                  {/* Reply Preview Bar */}
                  {replyingToMessage && (
                    <ReplyPreviewBar
                      replyingTo={replyingToMessage}
                      onCancel={() => setReplyingToMessage(null)}
                    />
                  )}

                  {/* Attachment Preview Bar */}
                  {selectedFiles.length > 0 && (
                    <AttachmentPicker
                      files={selectedFiles}
                      onRemoveFile={handleRemoveFile}
                      onClearAll={() => setSelectedFiles([])}
                      uploadProgress={uploadProgress}
                      uploadError={uploadError}
                      onRetryUpload={handleRetryUpload}
                      isUploading={isUploadingMedia}
                    />
                  )}

                  {isVoiceRecordingActive ? (
                    <VoiceRecorderBar
                      recordingSeconds={recordingSeconds}
                      liveWaveform={liveWaveform}
                      error={voiceRecorderError}
                      onCancel={handleCancelVoice}
                      onSend={handleSendVoice}
                      isSending={isSendingVoice}
                    />
                  ) : (
                    <form
                      onSubmit={handleSendMessage}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--color-surface)',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Đính kèm ảnh hoặc video"
                        disabled={isUploadingMedia}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.375rem',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: selectedFiles.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            selectedFiles.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)')
                        }
                      >
                        <ImageIcon size={20} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        title="Chụp ảnh hoặc quay video"
                        disabled={isUploadingMedia}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.375rem',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-muted)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                      >
                        <Camera size={20} />
                      </button>

                      <button
                        type="button"
                        onClick={handleStartVoice}
                        title="Ghi âm tin nhắn thoại"
                        disabled={isUploadingMedia || isSending}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.375rem',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-muted)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                      >
                        <Mic size={20} />
                      </button>

                      {currentConv?.type === 'Group' && (
                        <button
                          type="button"
                          onClick={() => setIsCreatePollOpen(true)}
                          title="Tạo cuộc bình chọn"
                          disabled={isUploadingMedia || isSending}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.375rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-muted)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        >
                          <BarChart2 size={20} />
                        </button>
                      )}

                      <input
                        ref={inputRef}
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            if (mentionMatch) setMentionMatch(null);
                            else if (replyingToMessage) setReplyingToMessage(null);
                          }
                        }}
                        placeholder={
                          currentConv?.type === 'Group'
                            ? 'Nhập tin nhắn... (gõ @ để nhắc tên)'
                            : 'Nhập tin nhắn...'
                        }
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
                        disabled={(!messageInput.trim() && selectedFiles.length === 0) || isSending || isUploadingMedia}
                        isLoading={isUploadingMedia || isSending}
                        style={{ borderRadius: 'var(--radius-full)', width: '40px', height: '40px', padding: 0 }}
                      >
                        <Send size={18} />
                      </Button>
                    </form>
                  )}
                </div>
              );
            })()}
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare size={36} />}
            title="Chọn một cuộc trò chuyện"
            description="Chọn từ danh sách bên trái hoặc tạo cuộc trò chuyện mới để bắt đầu chat thời gian thực."
          />
        )}
      </div>

      {isGroupInfoOpen && currentConv?.type === 'Group' && (
        <GroupInfoPanel
          conversation={currentConv}
          onClose={() => setIsGroupInfoOpen(false)}
          onConversationDeleted={() => {
            setSelectedConvId(null);
            setIsGroupInfoOpen(false);
          }}
        />
      )}

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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={(newConv) => {
          setSelectedConvId(newConv.id);
        }}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCaptureCamera}
      />

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
        onSubmit={handleCreatePoll}
      />
    </div>
  );
};
