namespace MySocialApp.Application.DTOs.Chat;

public class GroupEventDto
{
    public Guid ConversationId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public Guid ActorUserId { get; set; }
    public List<Guid> AffectedUserIds { get; set; } = new();
    public ConversationDto? Conversation { get; set; }
    public GroupJoinRequestDto? JoinRequest { get; set; }
    public MessageDto? SystemMessage { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
