namespace MySocialApp.Application.DTOs.Chat;

public class PollUpdatedEventDto
{
    public Guid ConversationId { get; set; }
    public Guid? MessageId { get; set; }
    public ChatPollDto Poll { get; set; } = null!;
}
