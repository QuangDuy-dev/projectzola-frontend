using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class VotePollRequest
{
    [Required]
    public List<Guid> OptionIds { get; set; } = new();
}
