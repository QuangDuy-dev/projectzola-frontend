namespace MySocialApp.Application.DTOs.Chat;

public class MessageReactionSummaryDto
{
    public string Emoji { get; set; } = string.Empty;
    public int Count { get; set; }
    public List<Guid> UserIds { get; set; } = new();
    public bool ReactedByCurrentUser { get; set; }
}
