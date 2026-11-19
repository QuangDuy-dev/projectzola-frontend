namespace MySocialApp.Application.DTOs.Chat;

public record TypingEventDto(Guid ConversationId, Guid UserId, string Username, bool IsTyping);
