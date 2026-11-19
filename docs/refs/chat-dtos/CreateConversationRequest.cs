using System.ComponentModel.DataAnnotations;

namespace MySocialApp.Application.DTOs.Chat;

public class CreateConversationRequest
{
    public Guid? ParticipantId { get; set; }
    public string? Username { get; set; }
}
