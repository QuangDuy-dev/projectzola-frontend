using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class TransferOwnershipRequest
{
    [Required]
    public Guid NewOwnerUserId { get; set; }
}
