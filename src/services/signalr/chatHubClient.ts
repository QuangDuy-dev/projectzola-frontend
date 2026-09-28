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
  MessageDeletedDto,
  MessageDeliveryDto,
  MessageDto,
  MessageReadDto,
  NotificationCountDto,
  NotificationDto,
  NotificationReadEventDto,
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
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (err) {
        console.warn('Error stopping SignalR connection:', err);
      } finally {
        this.connection = null;
        this.notifyConnection(false);
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
