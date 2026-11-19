namespace MySocialApp.Application.DTOs.Chat;

public class MessagePinEventDto
{
    public Guid ConversationId { get; set; }
    public Guid MessageId { get; set; }
    public bool IsPinned { get; set; }
    public Guid? PinnedById { get; set; }
    public DateTime? PinnedAt { get; set; }
    public MessageDto? Message { get; set; }
}
