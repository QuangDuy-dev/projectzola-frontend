using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class UpdateMemberRoleRequest
{
    [Required]
    public string Role { get; set; } = "Member";
}
