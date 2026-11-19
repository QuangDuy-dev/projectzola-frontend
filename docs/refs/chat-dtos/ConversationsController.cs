using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MySocialApp.Api.Hubs;
using MySocialApp.Application.DTOs.Chat;
using MySocialApp.Application.DTOs.Common;
using MySocialApp.Application.Interfaces;
using MySocialApp.Domain.Enums;

namespace MySocialApp.Api.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IGroupChatService _groupChatService;
    private readonly IChatMediaService _chatMediaService;
    private readonly IChatInteractionService _chatInteractionService;
    private readonly IUserService _userService;
    private readonly IApplicationDbContext _context;
    private readonly IHubContext<ChatHub, IChatClient> _hubContext;

    public ConversationsController(
        IChatService chatService,
        IGroupChatService groupChatService,
        IChatMediaService chatMediaService,
        IChatInteractionService chatInteractionService,
        IUserService userService,
        IApplicationDbContext context,
        IHubContext<ChatHub, IChatClient> hubContext)
    {
        _chatService = chatService;
        _groupChatService = groupChatService;
        _chatMediaService = chatMediaService;
        _chatInteractionService = chatInteractionService;
        _userService = userService;
        _context = context;
        _hubContext = hubContext;
    }

    private Guid GetCurrentUserId()
    {
        return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    private async Task<List<string>> BuildTargetGroupsAsync(
        Guid conversationId,
        IEnumerable<Guid>? extraUserIds = null,
        CancellationToken ct = default)
    {
        var memberIds = await _context.ConversationMembers
            .AsNoTracking()
            .Where(cm => cm.ConversationId == conversationId)
            .Select(cm => cm.UserId)
            .ToListAsync(ct);

        var targetGroups = new HashSet<string> { $"conversation:{conversationId}" };
        foreach (var mId in memberIds)
        {
            targetGroups.Add($"user:{mId}");
        }

        if (extraUserIds != null)
        {
            foreach (var extraId in extraUserIds)
            {
                if (extraId != Guid.Empty)
                {
                    targetGroups.Add($"user:{extraId}");
                }
            }
        }

        return targetGroups.ToList();
    }

    private async Task<List<string>> BuildAdminGroupsAsync(
        Guid conversationId,
        IEnumerable<Guid>? extraUserIds = null,
        CancellationToken ct = default)
    {
        var adminIds = await _context.ConversationMembers
            .AsNoTracking()
            .Where(cm => cm.ConversationId == conversationId
                         && (cm.Role == ConversationMemberRole.Owner || cm.Role == ConversationMemberRole.Admin))
            .Select(cm => cm.UserId)
            .ToListAsync(ct);

        var targetGroups = new HashSet<string>();
        foreach (var adminId in adminIds)
        {
            targetGroups.Add($"user:{adminId}");
        }

        if (extraUserIds != null)
        {
            foreach (var extraId in extraUserIds)
            {
                if (extraId != Guid.Empty)
                {
                    targetGroups.Add($"user:{extraId}");
                }
            }
        }

        return targetGroups.ToList();
    }

    private static List<Guid>? ParseMentionedUserIds(List<string>? rawValues)
    {
        if (rawValues == null || rawValues.Count == 0)
            return null;

        var result = new List<Guid>();
        foreach (var raw in rawValues)
        {
            if (string.IsNullOrWhiteSpace(raw))
                continue;

            var trimmed = raw.Trim();
            if (trimmed.StartsWith('['))
            {
                try
                {
                    var parsedArray = JsonSerializer.Deserialize<List<Guid>>(trimmed);
                    if (parsedArray != null)
                    {
                        result.AddRange(parsedArray.Where(g => g != Guid.Empty));
                        continue;
                    }
                }
                catch
                {
                    // Fall back to comma-separated parsing
                }
            }

            foreach (var part in trimmed.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (Guid.TryParse(part, out var id) && id != Guid.Empty)
                {
                    result.Add(id);
                }
            }
        }

        return result.Count > 0 ? result.Distinct().ToList() : null;
    }

    // =====================================================
    // Existing Direct / Core Conversation & Message Routes
    // =====================================================

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ConversationDto>>>> GetAll([FromQuery] PaginationParams pagination)
    {
        var userId = GetCurrentUserId();
        var result = await _chatService.GetConversationsAsync(userId, pagination);
        return Ok(ApiResponse<PagedResult<ConversationDto>>.SuccessResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ConversationDto>>> CreateOrGet([FromBody] CreateConversationRequest request)
    {
        var userId = GetCurrentUserId();
        Guid participantId;

        if (request.ParticipantId.HasValue && request.ParticipantId.Value != Guid.Empty)
        {
            participantId = request.ParticipantId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(request.Username))
        {
            var user = await _userService.GetByUsernameAsync(request.Username);
            if (user == null)
            {
                return NotFound(ApiResponse<ConversationDto>.ErrorResponse($"Không tìm thấy người dùng '@{request.Username.TrimStart('@')}'."));
            }
            participantId = user.Id;
        }
        else
        {
            return BadRequest(ApiResponse<ConversationDto>.ErrorResponse("Vui lòng cung cấp ParticipantId hoặc Username."));
        }

        var result = await _chatService.GetOrCreateConversationAsync(userId, participantId);

        // Notify both participants so the conversation appears in their conversation lists immediately
        await _hubContext.Clients.Groups(new[] { $"user:{participantId}", $"user:{userId}" }).ConversationUpdated(result);

        return Ok(ApiResponse<ConversationDto>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ConversationDto>>> GetById(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await _groupChatService.GetConversationByIdAsync(id, userId, HttpContext.RequestAborted);
        return Ok(ApiResponse<ConversationDto>.SuccessResponse(result));
    }

    [HttpGet("{id}/messages")]
    public async Task<ActionResult<ApiResponse<PagedResult<MessageDto>>>> GetMessages(Guid id, [FromQuery] PaginationParams pagination)
    {
        var userId = GetCurrentUserId();
        var result = await _chatService.GetMessagesAsync(id, userId, pagination);
        return Ok(ApiResponse<PagedResult<MessageDto>>.SuccessResponse(result));
    }

    [HttpPost("{id}/messages")]
    public async Task<ActionResult<ApiResponse<MessageDto>>> SendMessage(Guid id, [FromBody] SendMessageRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _chatService.SendMessageAsync(id, userId, request);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: HttpContext.RequestAborted);
        await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result);

        return Created("", ApiResponse<MessageDto>.SuccessResponse(result, "Message sent."));
    }

    [HttpPut("{id}/messages/{messageId}")]
    public async Task<ActionResult<ApiResponse<MessageDto>>> EditMessage(Guid id, Guid messageId, [FromBody] EditMessageRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _chatService.EditMessageAsync(messageId, userId, request);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: HttpContext.RequestAborted);
        await _hubContext.Clients.Groups(targetGroups).MessageUpdated(result);

        return Ok(ApiResponse<MessageDto>.SuccessResponse(result, "Message updated."));
    }

    [HttpDelete("{id}/messages/{messageId}")]
    public async Task<ActionResult<ApiResponse<MessageDeletedDto>>> DeleteMessage(Guid id, Guid messageId)
    {
        var userId = GetCurrentUserId();
        var result = await _chatService.DeleteMessageAsync(messageId, userId);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: HttpContext.RequestAborted);
        await _hubContext.Clients.Groups(targetGroups).MessageDeleted(result);

        return Ok(ApiResponse<MessageDeletedDto>.SuccessResponse(result, "Message deleted."));
    }

    [HttpPost("{id}/read")]
    public async Task<ActionResult<ApiResponse<MessageReadDto>>> MarkRead(Guid id, [FromBody] MarkReadRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _chatService.MarkAsReadAsync(id, userId, request);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: HttpContext.RequestAborted);
        await _hubContext.Clients.Groups(targetGroups).MessageRead(result);

        return Ok(ApiResponse<MessageReadDto>.SuccessResponse(result, "Message marked as read."));
    }

    // =====================================================
    // Group Chat Management Routes (Zalo Group Pro)
    // =====================================================

    [HttpPost("groups")]
    public async Task<ActionResult<ApiResponse<ConversationDto>>> CreateGroup([FromBody] CreateGroupConversationRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.CreateGroupAsync(userId, request, ct);

        var memberGroups = result.Members
            .Select(m => $"user:{m.UserId}")
            .Distinct()
            .ToList();

        if (memberGroups.Count > 0)
        {
            await _hubContext.Clients.Groups(memberGroups).ConversationUpdated(result);
        }

        return Created("", ApiResponse<ConversationDto>.SuccessResponse(result, "Group created."));
    }

    [HttpPut("{id}/group")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> UpdateGroupSettings(
        Guid id,
        [FromBody] UpdateGroupSettingsRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.UpdateGroupSettingsAsync(id, userId, request, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).GroupUpdated(result);
        if (result.Conversation != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
        }
        if (result.SystemMessage != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result, "Group settings updated."));
    }

    [HttpPost("{id}/avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(15_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 15_000_000)]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> UpdateGroupAvatar(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<GroupEventDto>.ErrorResponse("Vui lòng chọn ảnh đại diện nhóm."));

        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;

        using var stream = file.OpenReadStream();
        var result = await _groupChatService.UpdateGroupAvatarAsync(id, userId, stream, file.FileName, file.ContentType, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).GroupUpdated(result);
        if (result.Conversation != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
        }
        if (result.SystemMessage != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result, "Group avatar updated."));
    }

    [HttpPost("{id}/members")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> AddMembers(
        Guid id,
        [FromBody] AddGroupMembersRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.AddMembersAsync(id, userId, request, ct);

        if (result.EventType == "JoinRequestCreated")
        {
            var adminGroups = await BuildAdminGroupsAsync(id, new[] { userId }, ct);
            if (adminGroups.Count > 0)
            {
                await _hubContext.Clients.Groups(adminGroups).JoinRequestUpdated(result);
            }
        }
        else if (result.AffectedUserIds.Count > 0)
        {
            var targetGroups = await BuildTargetGroupsAsync(id, result.AffectedUserIds, ct);
            await _hubContext.Clients.Groups(targetGroups).GroupMemberAdded(result);
            if (result.Conversation != null)
            {
                await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
            }
            if (result.SystemMessage != null)
            {
                await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
            }
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result));
    }

    [HttpDelete("{id}/members/{memberUserId}")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> RemoveMember(Guid id, Guid memberUserId)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.RemoveMemberAsync(id, userId, memberUserId, ct);

        var allAffectedGroups = await BuildTargetGroupsAsync(id, new[] { memberUserId }, ct);
        await _hubContext.Clients.Groups(allAffectedGroups).GroupMemberRemoved(result);

        var remainingGroups = await BuildTargetGroupsAsync(id, ct: ct);
        if (result.Conversation != null)
        {
            await _hubContext.Clients.Groups(remainingGroups).ConversationUpdated(result.Conversation);
        }
        if (result.SystemMessage != null)
        {
            await _hubContext.Clients.Groups(remainingGroups).ReceiveMessage(result.SystemMessage);
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result, "Member removed."));
    }

    [HttpPut("{id}/members/{memberUserId}/role")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> UpdateMemberRole(
        Guid id,
        Guid memberUserId,
        [FromBody] UpdateMemberRoleRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.UpdateMemberRoleAsync(id, userId, memberUserId, request, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).GroupUpdated(result);
        if (result.Conversation != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
        }
        if (result.SystemMessage != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result, "Member role updated."));
    }

    [HttpPut("{id}/members/{memberUserId}/nickname")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> UpdateNickname(
        Guid id,
        Guid memberUserId,
        [FromBody] UpdateNicknameRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.UpdateNicknameAsync(id, userId, memberUserId, request, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).GroupUpdated(result);
        if (result.Conversation != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
        }
        if (result.SystemMessage != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result, "Nickname updated."));
    }

    [HttpPost("{id}/transfer-owner")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> TransferOwnership(
        Guid id,
        [FromBody] TransferOwnershipRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.TransferOwnershipAsync(id, userId, request, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).GroupUpdated(result);
        if (result.Conversation != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
        }
        if (result.SystemMessage != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result, "Ownership transferred."));
    }

    [HttpPost("{id}/leave")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> LeaveGroup(
        Guid id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] LeaveGroupRequest? request = null)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.LeaveGroupAsync(id, userId, request, ct);

        if (result.EventType == "GroupDisbanded")
        {
            await _hubContext.Clients.Groups(new[] { $"conversation:{id}", $"user:{userId}" }).GroupDisbanded(result);
        }
        else
        {
            var allAffectedGroups = await BuildTargetGroupsAsync(id, new[] { userId }, ct);
            await _hubContext.Clients.Groups(allAffectedGroups).GroupMemberRemoved(result);

            var remainingGroups = await BuildTargetGroupsAsync(id, ct: ct);
            if (result.Conversation != null)
            {
                await _hubContext.Clients.Groups(remainingGroups).ConversationUpdated(result.Conversation);
            }
            if (result.SystemMessage != null)
            {
                await _hubContext.Clients.Groups(remainingGroups).ReceiveMessage(result.SystemMessage);
            }
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result, "Left group."));
    }

    [HttpDelete("{id}/disband")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> DisbandGroup(Guid id)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.DisbandGroupAsync(id, userId, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, result.AffectedUserIds, ct);
        await _hubContext.Clients.Groups(targetGroups).GroupDisbanded(result);
        if (result.Conversation != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
        }
        if (result.SystemMessage != null)
        {
            await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result, "Group disbanded."));
    }

    [HttpPut("{id}/mute")]
    public async Task<ActionResult<ApiResponse<DateTime?>>> MuteConversation(
        Guid id,
        [FromBody] MuteConversationRequest request)
    {
        var userId = GetCurrentUserId();
        var mutedUntil = await _groupChatService.MuteConversationAsync(id, userId, request, HttpContext.RequestAborted);
        return Ok(ApiResponse<DateTime?>.SuccessResponse(
            mutedUntil,
            mutedUntil.HasValue ? "Conversation muted." : "Conversation unmuted."));
    }

    [HttpPost("{id}/invite-link/reset")]
    public async Task<ActionResult<ApiResponse<InviteCodeResponse>>> RegenerateInviteCode(Guid id)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var newCode = await _groupChatService.RegenerateInviteCodeAsync(id, userId, ct);

        var updatedConversation = await _groupChatService.GetConversationByIdAsync(id, userId, ct);
        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(updatedConversation);

        return Ok(ApiResponse<InviteCodeResponse>.SuccessResponse(
            new InviteCodeResponse(newCode),
            "Invite link regenerated."));
    }

    [HttpGet("invite/{inviteCode}")]
    public async Task<ActionResult<ApiResponse<GroupInvitePreviewDto>>> GetInvitePreview(string inviteCode)
    {
        var userId = GetCurrentUserId();
        var result = await _groupChatService.GetInvitePreviewAsync(inviteCode, userId, HttpContext.RequestAborted);
        return Ok(ApiResponse<GroupInvitePreviewDto>.SuccessResponse(result));
    }

    [HttpPost("invite/{inviteCode}/join")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> JoinByInviteCode(string inviteCode)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.JoinByInviteCodeAsync(inviteCode, userId, ct);

        if (result.EventType == "JoinRequestCreated")
        {
            var adminGroups = await BuildAdminGroupsAsync(result.ConversationId, new[] { userId }, ct);
            if (adminGroups.Count > 0)
            {
                await _hubContext.Clients.Groups(adminGroups).JoinRequestUpdated(result);
            }
        }
        else if (result.EventType == "MembersAdded")
        {
            var targetGroups = await BuildTargetGroupsAsync(result.ConversationId, new[] { userId }, ct);
            await _hubContext.Clients.Groups(targetGroups).GroupMemberAdded(result);
            if (result.Conversation != null)
            {
                await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
            }
            if (result.SystemMessage != null)
            {
                await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
            }
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result));
    }

    [HttpGet("{id}/join-requests")]
    public async Task<ActionResult<ApiResponse<List<GroupJoinRequestDto>>>> GetJoinRequests(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await _groupChatService.GetJoinRequestsAsync(id, userId, HttpContext.RequestAborted);
        return Ok(ApiResponse<List<GroupJoinRequestDto>>.SuccessResponse(result.ToList()));
    }

    [HttpPost("{id}/join-requests/{requestId}/review")]
    public async Task<ActionResult<ApiResponse<GroupEventDto>>> ReviewJoinRequest(
        Guid id,
        Guid requestId,
        [FromBody] ReviewJoinRequestDto request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _groupChatService.ReviewJoinRequestAsync(id, requestId, userId, request, ct);

        var adminAndRequesterGroups = await BuildAdminGroupsAsync(id, result.AffectedUserIds, ct);
        if (adminAndRequesterGroups.Count > 0)
        {
            await _hubContext.Clients.Groups(adminAndRequesterGroups).JoinRequestUpdated(result);
        }

        if (result.EventType == "JoinRequestApproved")
        {
            var targetGroups = await BuildTargetGroupsAsync(id, result.AffectedUserIds, ct);
            await _hubContext.Clients.Groups(targetGroups).GroupMemberAdded(result);
            if (result.Conversation != null)
            {
                await _hubContext.Clients.Groups(targetGroups).ConversationUpdated(result.Conversation);
            }
            if (result.SystemMessage != null)
            {
                await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result.SystemMessage);
            }
        }

        return Ok(ApiResponse<GroupEventDto>.SuccessResponse(result));
    }

    // =====================================================
    // Rich Media, Voice, Pin, Reaction & Poll Routes
    // =====================================================

    [HttpPost("{id}/messages/media")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(60_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 60_000_000)]
    public async Task<ActionResult<ApiResponse<MessageDto>>> SendMediaMessage(
        Guid id,
        [FromForm] SendMediaMessageFormRequest form)
    {
        if (form?.Files == null || form.Files.Count == 0)
            return BadRequest(ApiResponse<MessageDto>.ErrorResponse("Vui lòng chọn ít nhất một tệp ảnh hoặc video."));

        if (form.Files.Any(f => f == null || f.Length == 0))
            return BadRequest(ApiResponse<MessageDto>.ErrorResponse("Một hoặc nhiều tệp đính kèm bị rỗng."));

        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var items = new List<SendMediaMessageItem>(form.Files.Count);
        var openedStreams = new List<Stream>(form.Files.Count);

        try
        {
            foreach (var file in form.Files)
            {
                var stream = file.OpenReadStream();
                openedStreams.Add(stream);
                items.Add(new SendMediaMessageItem
                {
                    Content = stream,
                    FileName = file.FileName,
                    ContentType = file.ContentType
                });
            }

            var mentionedUserIds = ParseMentionedUserIds(form.MentionedUserIds);
            var result = await _chatMediaService.SendMediaMessageAsync(
                id,
                userId,
                items,
                form.Content,
                form.ReplyToMessageId,
                mentionedUserIds,
                form.MentionAll,
                form.ClientMessageId,
                ct);

            var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
            await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result);

            return Created("", ApiResponse<MessageDto>.SuccessResponse(result, "Media message sent."));
        }
        finally
        {
            foreach (var stream in openedStreams)
            {
                stream.Dispose();
            }
        }
    }

    [HttpPost("{id}/messages/voice")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 20_000_000)]
    public async Task<ActionResult<ApiResponse<MessageDto>>> SendVoiceMessage(
        Guid id,
        [FromForm] SendVoiceMessageFormRequest form)
    {
        if (form?.Audio == null || form.Audio.Length == 0)
            return BadRequest(ApiResponse<MessageDto>.ErrorResponse("Vui lòng chọn tệp âm thanh."));

        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;

        using var stream = form.Audio.OpenReadStream();
        var input = new SendVoiceMessageInput
        {
            Content = stream,
            FileName = form.Audio.FileName,
            ContentType = form.Audio.ContentType,
            DurationSeconds = form.DurationSeconds,
            WaveformJson = form.WaveformJson,
            ReplyToMessageId = form.ReplyToMessageId,
            ClientMessageId = form.ClientMessageId
        };

        var result = await _chatMediaService.SendVoiceMessageAsync(id, userId, input, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result);

        return Created("", ApiResponse<MessageDto>.SuccessResponse(result, "Voice message sent."));
    }

    [HttpGet("{id}/pinned-messages")]
    public async Task<ActionResult<ApiResponse<List<MessageDto>>>> GetPinnedMessages(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await _chatInteractionService.GetPinnedMessagesAsync(id, userId, HttpContext.RequestAborted);
        return Ok(ApiResponse<List<MessageDto>>.SuccessResponse(result.ToList()));
    }

    [HttpPost("{id}/messages/{messageId}/pin")]
    public async Task<ActionResult<ApiResponse<MessagePinEventDto>>> PinMessage(Guid id, Guid messageId)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _chatInteractionService.PinMessageAsync(id, messageId, userId, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).MessagePinned(result);

        return Ok(ApiResponse<MessagePinEventDto>.SuccessResponse(result, "Message pinned."));
    }

    [HttpDelete("{id}/messages/{messageId}/pin")]
    public async Task<ActionResult<ApiResponse<MessagePinEventDto>>> UnpinMessage(Guid id, Guid messageId)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _chatInteractionService.UnpinMessageAsync(id, messageId, userId, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).MessageUnpinned(result);

        return Ok(ApiResponse<MessagePinEventDto>.SuccessResponse(result, "Message unpinned."));
    }

    [HttpPost("{id}/messages/{messageId}/reactions")]
    public async Task<ActionResult<ApiResponse<MessageReactionEventDto>>> ToggleReaction(
        Guid id,
        Guid messageId,
        [FromBody] ToggleReactionRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _chatInteractionService.ToggleReactionAsync(id, messageId, userId, request, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).MessageReactionUpdated(result);

        return Ok(ApiResponse<MessageReactionEventDto>.SuccessResponse(result));
    }

    [HttpPost("{id}/polls")]
    public async Task<ActionResult<ApiResponse<MessageDto>>> CreatePoll(
        Guid id,
        [FromBody] CreatePollRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _chatInteractionService.CreatePollAsync(id, userId, request, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).ReceiveMessage(result);

        return Created("", ApiResponse<MessageDto>.SuccessResponse(result, "Poll created."));
    }

    [HttpPost("{id}/polls/{pollId}/vote")]
    public async Task<ActionResult<ApiResponse<PollUpdatedEventDto>>> VotePoll(
        Guid id,
        Guid pollId,
        [FromBody] VotePollRequest request)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _chatInteractionService.VotePollAsync(id, pollId, userId, request, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).PollUpdated(result);

        return Ok(ApiResponse<PollUpdatedEventDto>.SuccessResponse(result, "Vote recorded."));
    }

    [HttpPost("{id}/polls/{pollId}/close")]
    public async Task<ActionResult<ApiResponse<PollUpdatedEventDto>>> ClosePoll(Guid id, Guid pollId)
    {
        var userId = GetCurrentUserId();
        var ct = HttpContext.RequestAborted;
        var result = await _chatInteractionService.ClosePollAsync(id, pollId, userId, ct);

        var targetGroups = await BuildTargetGroupsAsync(id, ct: ct);
        await _hubContext.Clients.Groups(targetGroups).PollUpdated(result);

        return Ok(ApiResponse<PollUpdatedEventDto>.SuccessResponse(result, "Poll closed."));
    }

    [HttpGet("{id}/polls/{pollId}")]
    public async Task<ActionResult<ApiResponse<ChatPollDto>>> GetPoll(Guid id, Guid pollId)
    {
        var userId = GetCurrentUserId();
        var result = await _chatInteractionService.GetPollAsync(id, pollId, userId, HttpContext.RequestAborted);
        return Ok(ApiResponse<ChatPollDto>.SuccessResponse(result));
    }
}

public record InviteCodeResponse(string InviteCode);

public class SendMediaMessageFormRequest
{
    public List<IFormFile> Files { get; set; } = new();
    public string? Content { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public string? ClientMessageId { get; set; }
    public List<string>? MentionedUserIds { get; set; }
    public bool MentionAll { get; set; }
}

public class SendVoiceMessageFormRequest
{
    public IFormFile? Audio { get; set; }
    public double? DurationSeconds { get; set; }
    public string? WaveformJson { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public string? ClientMessageId { get; set; }
}
