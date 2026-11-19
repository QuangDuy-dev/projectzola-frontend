using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class ToggleReactionRequest
{
    [Required]
    [StringLength(16, MinimumLength = 1)]
    public string Emoji { get; set; } = string.Empty;
}
