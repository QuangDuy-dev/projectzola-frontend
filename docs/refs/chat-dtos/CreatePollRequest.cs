using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class CreatePollRequest
{
    [Required]
    [StringLength(300, MinimumLength = 1)]
    public string Question { get; set; } = string.Empty;

    [Required]
    [MinLength(2)]
    [MaxLength(10)]
    public List<string> Options { get; set; } = new();

    public bool AllowMultipleChoices { get; set; }
    public bool IsAnonymous { get; set; }
    public DateTime? ExpiresAt { get; set; }

    [MaxLength(64)]
    public string? ClientMessageId { get; set; }
}
