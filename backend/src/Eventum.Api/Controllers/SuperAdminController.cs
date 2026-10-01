using Eventum.Application.SuperAdmin.DTOs;
using Eventum.Application.SuperAdmin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize(Roles = "superadmin")]
[Route("api/v1/superadmin")]
public class SuperAdminController : BaseApiController
{
    private readonly ISuperAdminService _superAdminService;

    public SuperAdminController(ISuperAdminService superAdminService)
    {
        _superAdminService = superAdminService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var stats = await _superAdminService.GetStatsAsync(cancellationToken);
        return Ok(stats);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        var users = await _superAdminService.GetUsersAsync(cancellationToken);
        return Ok(users);
    }

    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid id, CancellationToken cancellationToken)
    {
        var user = await _superAdminService.GetUserDetailAsync(id, cancellationToken);
        return Ok(user);
    }

    [HttpPut("users/{id:guid}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleRequest request, CancellationToken cancellationToken)
    {
        var success = await _superAdminService.UpdateUserRoleAsync(id, request, cancellationToken);
        return Ok(new { success });
    }

    [HttpGet("events")]
    public async Task<IActionResult> GetEvents(CancellationToken cancellationToken)
    {
        var events = await _superAdminService.GetEventsAsync(cancellationToken);
        return Ok(events);
    }

    [HttpGet("subscriptions")]
    public async Task<IActionResult> GetSubscriptions(CancellationToken cancellationToken)
    {
        var subs = await _superAdminService.GetSubscriptionsAsync(cancellationToken);
        return Ok(subs);
    }
}
