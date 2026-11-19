using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class CreateGroupConversationRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    public List<Guid> MemberIds { get; set; } = new();
    public bool RequireJoinApproval { get; set; }
    public bool OnlyAdminsCanSend { get; set; }
    public bool IsInviteLinkEnabled { get; set; } = true;
}
