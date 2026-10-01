using Eventum.Application.Guests.DTOs;
using Eventum.Application.Guests.Services;
using Eventum.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize]
[Route("api/v1/events/{eventId:guid}/guests")]
public class GuestsController : BaseApiController
{
    private readonly IGuestService _guestService;

    public GuestsController(IGuestService guestService)
    {
        _guestService = guestService;
    }

    [HttpGet]
    public async Task<IActionResult> GetGuests(
        Guid eventId,
        [FromQuery] InviteStatus? status,
        [FromQuery] GuestGroup? group,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var guests = await _guestService.GetGuestsAsync(eventId, CurrentUserId, status, group, search, cancellationToken);
        return Ok(guests);
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics(Guid eventId, CancellationToken cancellationToken)
    {
        var metrics = await _guestService.GetMetricsAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(metrics);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetGuestById(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var guest = await _guestService.GetGuestByIdAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(guest);
    }

    [HttpPost]
    public async Task<IActionResult> CreateGuest(Guid eventId, [FromBody] CreateGuestRequest request, CancellationToken cancellationToken)
    {
        var guest = await _guestService.CreateGuestAsync(eventId, CurrentUserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, guest);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateGuest(Guid eventId, Guid id, [FromBody] UpdateGuestRequest request, CancellationToken cancellationToken)
    {
        var guest = await _guestService.UpdateGuestAsync(eventId, id, CurrentUserId, request, cancellationToken);
        return Ok(guest);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteGuest(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var success = await _guestService.DeleteGuestAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(new { success });
    }

    [HttpPost("{id:guid}/regenerate-token")]
    public async Task<IActionResult> RegenerateToken(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var token = await _guestService.RegenerateTokenAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(new { token });
    }

    [HttpPost("send-emails")]
    public async Task<IActionResult> SendEmails(Guid eventId, [FromBody] SendGuestEmailsRequest request, CancellationToken cancellationToken)
    {
        var count = await _guestService.SendEmailsAsync(eventId, CurrentUserId, request.GuestIds, cancellationToken);
        return Ok(new { sentCount = count });
    }

    [HttpPost("send-second-confirmation")]
    public async Task<IActionResult> SendSecondConfirmation(Guid eventId, [FromBody] SendSecondConfirmationRequest request, CancellationToken cancellationToken)
    {
        var count = await _guestService.SendSecondConfirmationAsync(eventId, CurrentUserId, request.All, request.GuestId, cancellationToken);
        return Ok(new { sentCount = count });
    }
}
