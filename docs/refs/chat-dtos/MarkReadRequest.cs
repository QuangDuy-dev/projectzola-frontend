using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class MarkReadRequest
{
    [Required]
    public Guid MessageId { get; set; }
}
