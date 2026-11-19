namespace MySocialApp.Application.DTOs.Chat;

public class SendMediaMessageItem
{
    public Stream Content { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}
