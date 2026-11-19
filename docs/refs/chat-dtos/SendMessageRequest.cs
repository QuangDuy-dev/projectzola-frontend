using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class SendMessageRequest
{
    [Required]
    [StringLength(4000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;

    [MaxLength(64)]
    public string? ClientMessageId { get; set; }

    public Guid? ReplyToMessageId { get; set; }
    public List<Guid>? MentionedUserIds { get; set; }
    public bool MentionAll { get; set; }
}
