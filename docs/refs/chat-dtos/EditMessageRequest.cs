using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class EditMessageRequest
{
    [Required]
    [StringLength(4000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}
