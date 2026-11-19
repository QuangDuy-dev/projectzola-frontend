namespace MySocialApp.Application.DTOs.Chat;

public class ReplyMessagePreviewDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderUsername { get; set; } = string.Empty;
    public string SenderDisplayName { get; set; } = string.Empty;
    public string Type { get; set; } = "Text";
    public string Content { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public string? ThumbnailUrl { get; set; }
}
