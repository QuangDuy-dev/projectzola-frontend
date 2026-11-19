namespace MySocialApp.Application.DTOs.Chat;

public class ChatPollOptionDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int VoteCount { get; set; }
    public bool VotedByCurrentUser { get; set; }
    public List<Guid> VoterIds { get; set; } = new();
}
