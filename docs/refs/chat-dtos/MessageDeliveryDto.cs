namespace MySocialApp.Application.DTOs.Chat;

public record MessageDeliveryDto(Guid MessageId, Guid ConversationId, Guid UserId, DateTime DeliveredAt);
