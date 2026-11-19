namespace MySocialApp.Application.DTOs.Chat;

public class ConversationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "Direct";
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
    public Guid? CreatedById { get; set; }
    public string? InviteCode { get; set; }
    public bool IsInviteLinkEnabled { get; set; } = true;
    public bool RequireJoinApproval { get; set; }
    public bool OnlyAdminsCanSend { get; set; }
    public bool IsDisbanded { get; set; }
    public int PinnedCount { get; set; }
    public DateTime? MutedUntil { get; set; }
    public string? CurrentUserRole { get; set; }
    public List<ConversationMemberDto> Members { get; set; } = new();
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ConversationMemberDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "Member";
    public string? Nickname { get; set; }
    public DateTime? MutedUntil { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime? LastReadAt { get; set; }
}
