using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class UpdateGroupSettingsRequest
{
    [StringLength(100, MinimumLength = 1)]
    public string? Name { get; set; }

    public bool? IsInviteLinkEnabled { get; set; }
    public bool? RequireJoinApproval { get; set; }
    public bool? OnlyAdminsCanSend { get; set; }
}
