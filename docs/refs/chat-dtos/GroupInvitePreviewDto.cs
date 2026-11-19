namespace MySocialApp.Application.DTOs.Chat;

public class GroupInvitePreviewDto
{
    public Guid ConversationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int MemberCount { get; set; }
    public bool RequireJoinApproval { get; set; }
    public bool IsAlreadyMember { get; set; }
    public bool HasPendingRequest { get; set; }
    public string InviteCode { get; set; } = string.Empty;
}
