using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySocialApp.Application.DTOs.Common;
using MySocialApp.Application.DTOs.Presence;
using MySocialApp.Application.Interfaces;

namespace MySocialApp.Api.Controllers;

[ApiController]
[Route("api/presence")]
[Authorize]
public class PresenceController : ControllerBase
{
    private readonly IPresenceQueryService _presenceQueryService;

    public PresenceController(IPresenceQueryService presenceQueryService)
    {
        _presenceQueryService = presenceQueryService;
    }

    private Guid GetCurrentUserId()
    {
        return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    [HttpGet("online-friends")]
    public async Task<ActionResult<ApiResponse<List<OnlineFriendDto>>>> GetOnlineFriends()
    {
        var userId = GetCurrentUserId();
        var result = await _presenceQueryService.GetOnlineFriendsAsync(userId, HttpContext.RequestAborted);
        return Ok(ApiResponse<List<OnlineFriendDto>>.SuccessResponse(result.ToList()));
    }

    [HttpPost("batch")]
    public async Task<ActionResult<ApiResponse<List<UserPresenceStatusDto>>>> GetBatchPresence([FromBody] BatchPresenceRequest request)
    {
        if (request?.UserIds == null || request.UserIds.Count == 0)
        {
            return Ok(ApiResponse<List<UserPresenceStatusDto>>.SuccessResponse(new List<UserPresenceStatusDto>()));
        }

        var result = await _presenceQueryService.GetBatchPresenceAsync(request.UserIds, HttpContext.RequestAborted);
        return Ok(ApiResponse<List<UserPresenceStatusDto>>.SuccessResponse(result.ToList()));
    }
}

public class BatchPresenceRequest
{
    public List<Guid> UserIds { get; set; } = new();
}
