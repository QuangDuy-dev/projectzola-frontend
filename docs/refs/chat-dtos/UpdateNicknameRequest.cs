using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class UpdateNicknameRequest
{
    [MaxLength(100)]
    public string? Nickname { get; set; }
}
