namespace MySocialApp.Application.DTOs.Chat;

public class GroupJoinRequestDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public Guid? RequestedById { get; set; }
    public string? RequestedByDisplayName { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid? ReviewedById { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
