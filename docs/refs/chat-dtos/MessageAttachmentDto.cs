namespace MySocialApp.Application.DTOs.Chat;

public class MessageAttachmentDto
{
    public Guid Id { get; set; }
    public string AttachmentType { get; set; } = string.Empty;
    public string StorageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string? OriginalFileName { get; set; }
    public long FileSizeBytes { get; set; }
    public double? DurationSeconds { get; set; }
    public string? WaveformJson { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public int SortOrder { get; set; }
}
