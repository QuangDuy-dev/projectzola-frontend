namespace MySocialApp.Application.DTOs.Chat;

public class MessageReactionEventDto
{
    public Guid ConversationId { get; set; }
    public Guid MessageId { get; set; }
    public Guid UserId { get; set; }
    public string Emoji { get; set; } = string.Empty;
    public bool Added { get; set; }
    public List<MessageReactionSummaryDto> Reactions { get; set; } = new();
}
