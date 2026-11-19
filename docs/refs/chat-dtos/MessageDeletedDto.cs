namespace MySocialApp.Application.DTOs.Chat;

public record MessageDeletedDto(Guid MessageId, Guid ConversationId);
