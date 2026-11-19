import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { APP_CONFIG } from '../../app/config';
import { useAuthStore } from '../../stores/authStore';
import type {
  ConversationDto,
  GroupEventDto,
  MessageDeletedDto,
  MessageDeliveryDto,
  MessageDto,
  MessagePinEventDto,
  MessageReactionEventDto,
  MessageReadDto,
  NotificationCountDto,
  NotificationDto,
  NotificationReadEventDto,
  PollUpdatedEventDto,
  TypingEventDto,
  UserPresenceDto,
} from '../../types';

export type SignalREventListeners = {
  onReceiveMessage?: (message: MessageDto) => void;
  onMessageUpdated?: (message: MessageDto) => void;
  onMessageDeleted?: (eventData: MessageDeletedDto) => void;
  onUserTyping?: (eventData: TypingEventDto) => void;
  onMessageDelivered?: (eventData: MessageDeliveryDto) => void;
  onMessageRead?: (eventData: MessageReadDto) => void;
  onUserPresenceChanged?: (eventData: UserPresenceDto) => void;
  onConversationUpdated?: (conversation: ConversationDto) => void;
  onGroupUpdated?: (eventData: GroupEventDto) => void;
  onGroupMemberAdded?: (eventData: GroupEventDto) => void;
  onGroupMemberRemoved?: (eventData: GroupEventDto) => void;
  onGroupDisbanded?: (eventData: GroupEventDto) => void;
  onMessageReactionUpdated?: (eventData: MessageReactionEventDto) => void;
  onMessagePinned?: (eventData: MessagePinEventDto) => void;
  onMessageUnpinned?: (eventData: MessagePinEventDto) => void;
  onPollUpdated?: (eventData: PollUpdatedEventDto) => void;
  onJoinRequestUpdated?: (eventData: GroupEventDto) => void;
  onNotificationReceived?: (notification: NotificationDto) => void;
  onNotificationRead?: (eventData: NotificationReadEventDto) => void;
  onNotificationCountChanged?: (eventData: NotificationCountDto) => void;
  onConnectionStatusChanged?: (isConnected: boolean) => void;
};

class ChatHubManager {
  private connection: HubConnection | null = null;
  private listeners: Set<SignalREventListeners> = new Set();
  private isConnecting = false;
  private activeConversationId: string | null = null;

  public subscribe(listener: SignalREventListeners): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getConnectionState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  public async start(): Promise<void> {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      if (this.activeConversationId) {
        try {
          await this.connection.invoke('JoinConversation', this.activeConversationId);
        } catch {}
      }
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      if (!this.connection) {
        this.connection = new HubConnectionBuilder()
          .withUrl(APP_CONFIG.signalrChatUrl, {
            accessTokenFactory: () => useAuthStore.getState().accessToken || '',
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          })
          .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
          .configureLogging(LogLevel.Warning)
          .build();

        this.registerHandlers(this.connection);
      }

      if (this.connection.state === HubConnectionState.Disconnected) {
        await this.connection.start();
        this.notifyConnection(true);

        if (this.activeConversationId) {
          try {
            await this.connection.invoke('JoinConversation', this.activeConversationId);
          } catch (e) {
            console.warn('SignalR: Join conversation after start failed:', e);
          }
        }
      }
    } catch (err) {
      console.warn('SignalR ChatHub connection failed:', err);
      this.notifyConnection(false);
    } finally {
      this.isConnecting = false;
    }
  }

  public async stop(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    this.isConnecting = false;
    this.activeConversationId = null;
    if (connection) {
      try {
        await connection.stop();
      } catch (err) {
        console.warn('Error stopping SignalR connection:', err);
      } finally {
        if (!this.connection) this.notifyConnection(false);
      }
    }
  }

  private registerHandlers(conn: HubConnection): void {
    conn.onclose(() => this.notifyConnection(false));
    conn.onreconnecting(() => this.notifyConnection(false));
    conn.onreconnected(async () => {
      this.notifyConnection(true);
      if (this.activeConversationId) {
        try {
          await conn.invoke('JoinConversation', this.activeConversationId);
        } catch (e) {
          console.warn('SignalR: Rejoin conversation on reconnect failed:', e);
        }
      }
    });

    conn.on('ReceiveMessage', (message: MessageDto) => {
      this.listeners.forEach((l) => l.onReceiveMessage?.(message));
    });

    conn.on('MessageUpdated', (message: MessageDto) => {
      this.listeners.forEach((l) => l.onMessageUpdated?.(message));
    });

    conn.on('MessageDeleted', (eventData: MessageDeletedDto) => {
      this.listeners.forEach((l) => l.onMessageDeleted?.(eventData));
    });

    conn.on('UserTyping', (eventData: TypingEventDto) => {
      this.listeners.forEach((l) => l.onUserTyping?.(eventData));
    });

    conn.on('MessageDelivered', (eventData: MessageDeliveryDto) => {
      this.listeners.forEach((l) => l.onMessageDelivered?.(eventData));
    });

    conn.on('MessageRead', (eventData: MessageReadDto) => {
      this.listeners.forEach((l) => l.onMessageRead?.(eventData));
    });

    conn.on('UserPresenceChanged', (eventData: UserPresenceDto) => {
      this.listeners.forEach((l) => l.onUserPresenceChanged?.(eventData));
    });

    conn.on('ConversationUpdated', (conversation: ConversationDto) => {
      this.listeners.forEach((l) => l.onConversationUpdated?.(conversation));
    });

    conn.on('GroupUpdated', (eventData: GroupEventDto) => {
      this.listeners.forEach((l) => l.onGroupUpdated?.(eventData));
    });

    conn.on('GroupMemberAdded', (eventData: GroupEventDto) => {
      this.listeners.forEach((l) => l.onGroupMemberAdded?.(eventData));
    });

    conn.on('GroupMemberRemoved', (eventData: GroupEventDto) => {
      this.listeners.forEach((l) => l.onGroupMemberRemoved?.(eventData));
    });

    conn.on('GroupDisbanded', (eventData: GroupEventDto) => {
      this.listeners.forEach((l) => l.onGroupDisbanded?.(eventData));
    });

    conn.on('MessageReactionUpdated', (eventData: MessageReactionEventDto) => {
      this.listeners.forEach((l) => l.onMessageReactionUpdated?.(eventData));
    });

    conn.on('MessagePinned', (eventData: MessagePinEventDto) => {
      this.listeners.forEach((l) => l.onMessagePinned?.(eventData));
    });

    conn.on('MessageUnpinned', (eventData: MessagePinEventDto) => {
      this.listeners.forEach((l) => l.onMessageUnpinned?.(eventData));
    });

    conn.on('PollUpdated', (eventData: PollUpdatedEventDto) => {
      this.listeners.forEach((l) => l.onPollUpdated?.(eventData));
    });

    conn.on('JoinRequestUpdated', (eventData: GroupEventDto) => {
      this.listeners.forEach((l) => l.onJoinRequestUpdated?.(eventData));
    });

    conn.on('NotificationReceived', (notification: NotificationDto) => {
      this.listeners.forEach((l) => l.onNotificationReceived?.(notification));
    });

    conn.on('NotificationRead', (eventData: NotificationReadEventDto) => {
      this.listeners.forEach((l) => l.onNotificationRead?.(eventData));
    });

    conn.on('NotificationCountChanged', (eventData: NotificationCountDto) => {
      this.listeners.forEach((l) => l.onNotificationCountChanged?.(eventData));
    });
  }

  private notifyConnection(isConnected: boolean): void {
    this.listeners.forEach((l) => l.onConnectionStatusChanged?.(isConnected));
  }

  // Client Invocations to ChatHub
  public async joinConversation(conversationId: string): Promise<void> {
    this.activeConversationId = conversationId;
    if (!this.isConnected()) {
      await this.start();
    }
    if (this.isConnected()) {
      try {
        await this.connection!.invoke('JoinConversation', conversationId);
      } catch (err) {
        console.warn('SignalR: joinConversation error:', err);
      }
    }
  }

  public async typingStarted(conversationId: string): Promise<void> {
    if (this.isConnected()) {
      await this.connection!.invoke('TypingStarted', conversationId);
    }
  }

  public async typingStopped(conversationId: string): Promise<void> {
    if (this.isConnected()) {
      await this.connection!.invoke('TypingStopped', conversationId);
    }
  }
}

export const chatHubClient = new ChatHubManager();
