namespace MySocialApp.Application.DTOs.Presence;

public class UserPresenceStatusDto
{
    public Guid UserId { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
}
