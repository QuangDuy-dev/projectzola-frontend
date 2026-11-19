namespace MySocialApp.Application.DTOs.Presence;

public class OnlineFriendDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
    /// <summary>
    /// "MutualFollow" | "DirectContact"
    /// </summary>
    public string Relationship { get; set; } = string.Empty;
}
