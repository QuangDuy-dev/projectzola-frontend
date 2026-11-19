import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IncomingCallDialog } from '../components/IncomingCallDialog';
import { ActiveCallWindow } from '../components/ActiveCallWindow';
import { CallControlsBar } from '../components/CallControlsBar';
import { CallLogMessageBubble } from '../components/CallLogMessageBubble';
import * as useCallHook from '../hooks/useCall';
import type { CallContextValue } from '../contexts/CallContext';
import type { MessageDto } from '../../../types';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: any) => children,
}));

// Mock auth store
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: (selector: (state: any) => any) =>
    selector({
      user: { id: 'user-me-123', displayName: 'Me' },
    }),
}));

describe('WebRTC Call UI Components [Milestones 1 - 4]', () => {
  const mockCallContextDefaults: CallContextValue = {
    callState: 'IDLE',
    activeSession: null,
    callType: 'Voice',
    durationSeconds: 0,
    isMinimized: false,
    partnerInfo: {
      userId: 'partner-456',
      displayName: 'Nguyen Van A',
      avatarUrl: null,
    },
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    startCall: vi.fn(),
    acceptCall: vi.fn(),
    rejectCall: vi.fn(),
    endCall: vi.fn(),
    toggleMute: vi.fn(),
    toggleVideo: vi.fn(),
    toggleScreenShare: vi.fn(),
    toggleMinimize: vi.fn(),
    setIsMinimized: vi.fn(),
  };

  let mockCallState: CallContextValue = { ...mockCallContextDefaults };

  beforeEach(() => {
    mockCallState = { ...mockCallContextDefaults };
    vi.spyOn(useCallHook, 'useCall').mockImplementation(() => mockCallState);
  });

  describe('Milestone 1: IncomingCallDialog', () => {
    it('returns null when callState is not RINGING_INCOMING', () => {
      mockCallState.callState = 'IDLE';
      const html = renderToStaticMarkup(<IncomingCallDialog />);
      expect(html).toBe('');
    });

    it('renders incoming voice call dialog with ripple animations and accept/reject buttons', () => {
      mockCallState.callState = 'RINGING_INCOMING';
      mockCallState.callType = 'Voice';
      mockCallState.partnerInfo = {
        userId: 'partner-456',
        displayName: 'Tran Thi B',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const html = renderToStaticMarkup(<IncomingCallDialog />);
      expect(html).toContain('Cuộc gọi thoại đến...');
      expect(html).toContain('Tran Thi B');
      expect(html).toContain('Từ chối');
      expect(html).toContain('Trả lời');
      expect(html).toContain('callRipple');
    });

    it('renders incoming video call dialog with video label', () => {
      mockCallState.callState = 'RINGING_INCOMING';
      mockCallState.callType = 'Video';

      const html = renderToStaticMarkup(<IncomingCallDialog />);
      expect(html).toContain('Cuộc gọi video đến...');
      expect(html).toContain('Từ chối');
      expect(html).toContain('Trả lời');
    });
  });

  describe('Milestone 2: ActiveCallWindow', () => {
    it('returns null when call is IDLE or RINGING_INCOMING', () => {
      mockCallState.callState = 'IDLE';
      expect(renderToStaticMarkup(<ActiveCallWindow />)).toBe('');

      mockCallState.callState = 'RINGING_INCOMING';
      expect(renderToStaticMarkup(<ActiveCallWindow />)).toBe('');
    });

    it('renders expanded voice call window with avatar, equalizer, and drag handle', () => {
      mockCallState.callState = 'CONNECTED';
      mockCallState.callType = 'Voice';
      mockCallState.durationSeconds = 65; // 01:05
      mockCallState.partnerInfo = {
        userId: 'partner-456',
        displayName: 'Le Van C',
        avatarUrl: null,
      };

      const html = renderToStaticMarkup(<ActiveCallWindow />);
      expect(html).toContain('Cuộc gọi thoại');
      expect(html).toContain('Le Van C');
      expect(html).toContain('01:05');
      expect(html).toContain('eqWave');
      expect(html).toContain('Kéo thả để di chuyển cửa sổ');
      expect(html).toContain('Thu nhỏ cửa sổ');
    });

    it('renders expanded video call window with video container and self PiP', () => {
      mockCallState.callState = 'CONNECTED';
      mockCallState.callType = 'Video';
      mockCallState.durationSeconds = 120; // 02:00

      const html = renderToStaticMarkup(<ActiveCallWindow />);
      expect(html).toContain('Cuộc gọi video');
      expect(html).toContain('02:00');
      expect(html).toContain('<video');
      expect(html).toContain('Bạn');
    });

    it('renders minimized PiP pill when isMinimized is true', () => {
      mockCallState.callState = 'CONNECTED';
      mockCallState.isMinimized = true;
      mockCallState.isMuted = true;
      mockCallState.durationSeconds = 45;

      const html = renderToStaticMarkup(<ActiveCallWindow />);
      expect(html).toContain('Cuộc gọi thu nhỏ');
      expect(html).toContain('00:45');
      expect(html).toContain('Đang tắt mic');
      expect(html).toContain('Mở rộng cửa sổ');
    });
  });

  describe('Milestone 3: CallControlsBar', () => {
    it('renders floating controls bar with mic, screen share, minimize, and hangup', () => {
      mockCallState.callType = 'Voice';
      mockCallState.isMuted = false;
      mockCallState.isScreenSharing = false;

      const html = renderToStaticMarkup(<CallControlsBar />);
      expect(html).toContain('Tắt Mic');
      expect(html).toContain('Chia sẻ màn hình');
      expect(html).toContain('Kết thúc cuộc gọi');
      expect(html).toContain('Thu nhỏ cửa sổ');
    });

    it('renders camera toggle button when callType is Video', () => {
      mockCallState.callType = 'Video';
      mockCallState.isVideoOff = false;

      const html = renderToStaticMarkup(<CallControlsBar />);
      expect(html).toContain('Tắt Camera');
    });

    it('displays active states when muted and screen sharing', () => {
      mockCallState.callType = 'Video';
      mockCallState.isMuted = true;
      mockCallState.isVideoOff = true;
      mockCallState.isScreenSharing = true;

      const html = renderToStaticMarkup(<CallControlsBar />);
      expect(html).toContain('Bật Mic');
      expect(html).toContain('Bật Camera');
      expect(html).toContain('Dừng chia sẻ màn hình');
    });
  });

  describe('Milestone 4: CallLogMessageBubble', () => {
    it('renders successful call log bubble with duration and call-back button', () => {
      const msg: MessageDto = {
        id: 'msg-1',
        conversationId: 'conv-100',
        senderId: 'user-me-123',
        senderUsername: 'me123',
        senderDisplayName: 'Me',
        isDeleted: false,
        type: 'CallLog',
        content: JSON.stringify({
          callSessionId: 'sess-1',
          callType: 'Voice',
          status: 'Ended',
          durationSeconds: 135,
          durationFormatted: '02:15',
          callerId: 'user-me-123',
          calleeId: 'partner-456',
          text: 'Cuộc gọi thoại (02:15)',
        }),
        createdAt: '2026-11-19T10:00:00Z',
      };

      const otherMember = {
        userId: 'partner-456',
        displayName: 'Partner User',
        avatarUrl: null,
      };

      const html = renderToStaticMarkup(
        <CallLogMessageBubble message={msg} otherMember={otherMember} />
      );

      expect(html).toContain('Cuộc gọi thoại (02:15)');
      expect(html).toContain('Gọi lại');
    });

    it('renders missed call log bubble with red indicator and missed call label', () => {
      const msg: MessageDto = {
        id: 'msg-2',
        conversationId: 'conv-100',
        senderId: 'partner-456',
        senderUsername: 'partner456',
        senderDisplayName: 'Partner User',
        isDeleted: false,
        type: 'CallLog',
        content: JSON.stringify({
          callSessionId: 'sess-2',
          callType: 'Video',
          status: 'Missed',
          durationSeconds: 0,
          durationFormatted: '00:00',
          callerId: 'partner-456',
          calleeId: 'user-me-123',
          text: 'Cuộc gọi video nhỡ',
        }),
        createdAt: '2026-11-19T10:05:00Z',
      };

      const otherMember = {
        userId: 'partner-456',
        displayName: 'Partner User',
        avatarUrl: null,
      };

      const html = renderToStaticMarkup(
        <CallLogMessageBubble message={msg} otherMember={otherMember} />
      );

      expect(html).toContain('Cuộc gọi video nhỡ');
      expect(html).toContain('Gọi lại');
    });

    it('handles non-JSON fallback content gracefully', () => {
      const msg: MessageDto = {
        id: 'msg-3',
        conversationId: 'conv-100',
        senderId: 'partner-456',
        senderUsername: 'partner456',
        senderDisplayName: 'Partner User',
        isDeleted: false,
        type: 'CallLog',
        content: 'Cuộc gọi thoại nhỡ',
        createdAt: '2026-11-19T10:10:00Z',
      };

      const html = renderToStaticMarkup(
        <CallLogMessageBubble message={msg} otherMember={null} />
      );

      expect(html).toContain('Cuộc gọi thoại nhỡ');
    });
  });
});
