using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class AddGroupMembersRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> UserIds { get; set; } = new();
}
