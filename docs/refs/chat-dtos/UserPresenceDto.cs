namespace MySocialApp.Application.DTOs.Chat;

public record UserPresenceDto(Guid UserId, bool IsOnline, DateTime Timestamp);
