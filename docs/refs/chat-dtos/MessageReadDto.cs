namespace MySocialApp.Application.DTOs.Chat;

public record MessageReadDto(Guid ConversationId, Guid UserId, Guid LastReadMessageId, DateTime ReadAt);
