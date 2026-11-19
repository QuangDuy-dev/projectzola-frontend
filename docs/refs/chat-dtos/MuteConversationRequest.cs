namespace MySocialApp.Application.DTOs.Chat;

public class MuteConversationRequest
{
    public DateTime? MutedUntil { get; set; }
    public int? DurationMinutes { get; set; }
}
