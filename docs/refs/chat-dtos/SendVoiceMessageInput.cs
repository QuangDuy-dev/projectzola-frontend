namespace MySocialApp.Application.DTOs.Chat;

public class SendVoiceMessageInput
{
    public Stream Content { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public double? DurationSeconds { get; set; }
    public string? WaveformJson { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public string? ClientMessageId { get; set; }
}
