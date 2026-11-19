namespace MySocialApp.Application.DTOs.Chat;

public class ChatPollDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid? MessageId { get; set; }
    public Guid CreatedById { get; set; }
    public string CreatedByDisplayName { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public bool AllowMultipleChoices { get; set; }
    public bool IsAnonymous { get; set; }
    public bool IsClosed { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalVotes { get; set; }
    public int TotalVoters { get; set; }
    public List<ChatPollOptionDto> Options { get; set; } = new();
}
