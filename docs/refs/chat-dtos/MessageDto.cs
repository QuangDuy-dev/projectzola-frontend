namespace MySocialApp.Application.DTOs.Chat;

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderUsername { get; set; } = string.Empty;
    public string SenderDisplayName { get; set; } = string.Empty;
    public string Type { get; set; } = "Text";
    public string Content { get; set; } = string.Empty;
    public string? ClientMessageId { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }

    public Guid? ReplyToMessageId { get; set; }
    public ReplyMessagePreviewDto? ReplyTo { get; set; }
    public List<Guid> MentionedUserIds { get; set; } = new();
    public bool MentionAll { get; set; }
    public bool IsPinned { get; set; }
    public Guid? PinnedById { get; set; }
    public DateTime? PinnedAt { get; set; }
    public List<MessageAttachmentDto> Attachments { get; set; } = new();
    public List<MessageReactionSummaryDto> Reactions { get; set; } = new();
    public ChatPollDto? Poll { get; set; }
}
