using MySocialApp.Application.DTOs.Chat;
using MySocialApp.Application.DTOs.Notifications;

namespace MySocialApp.Application.Interfaces;

public interface IChatClient
{
    // Chat events
    Task ReceiveMessage(MessageDto message);
    Task MessageUpdated(MessageDto message);
    Task MessageDeleted(MessageDeletedDto eventData);
    Task UserTyping(TypingEventDto eventData);
    Task MessageDelivered(MessageDeliveryDto eventData);
    Task MessageRead(MessageReadDto eventData);
    Task UserPresenceChanged(UserPresenceDto eventData);
    Task ConversationUpdated(ConversationDto conversation);

    // Group & rich chat events
    Task GroupUpdated(GroupEventDto eventData);
    Task GroupMemberAdded(GroupEventDto eventData);
    Task GroupMemberRemoved(GroupEventDto eventData);
    Task GroupDisbanded(GroupEventDto eventData);
    Task MessageReactionUpdated(MessageReactionEventDto eventData);
    Task MessagePinned(MessagePinEventDto eventData);
    Task MessageUnpinned(MessagePinEventDto eventData);
    Task PollUpdated(PollUpdatedEventDto eventData);
    Task JoinRequestUpdated(GroupEventDto eventData);

    // Notification events
    Task NotificationReceived(NotificationDto notification);
    Task NotificationRead(NotificationReadEventDto eventData);
    Task NotificationCountChanged(NotificationCountDto eventData);
}
