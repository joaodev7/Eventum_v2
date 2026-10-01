using Eventum.Application.Events.DTOs;
using Eventum.Application.Events.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize]
public class EventsController : BaseApiController
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUserEvents(CancellationToken cancellationToken)
    {
        var events = await _eventService.GetUserEventsAsync(CurrentUserId, cancellationToken);
        return Ok(events);
    }

    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request, CancellationToken cancellationToken)
    {
        var ev = await _eventService.CreateEventAsync(CurrentUserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ev);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEventById(Guid id, CancellationToken cancellationToken)
    {
        var ev = await _eventService.GetEventByIdAsync(id, CurrentUserId, cancellationToken);
        return Ok(ev);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventRequest request, CancellationToken cancellationToken)
    {
        var ev = await _eventService.UpdateEventAsync(id, CurrentUserId, request, cancellationToken);
        return Ok(ev);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken cancellationToken)
    {
        await _eventService.DeleteEventAsync(id, CurrentUserId, cancellationToken);
        return Ok(new { success = true });
    }

    [HttpGet("{id:guid}/users")]
    public async Task<IActionResult> GetEventMembers(Guid id, CancellationToken cancellationToken)
    {
        var members = await _eventService.GetMembersAsync(id, CurrentUserId, cancellationToken);
        return Ok(members);
    }

    [HttpPost("{id:guid}/users")]
    public async Task<IActionResult> AddEventMember(Guid id, [FromBody] AddEventMemberRequest request, CancellationToken cancellationToken)
    {
        var member = await _eventService.AddMemberAsync(id, CurrentUserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, member);
    }

    [HttpDelete("{id:guid}/users/{memberUserId:guid}")]
    public async Task<IActionResult> RemoveEventMember(Guid id, Guid memberUserId, CancellationToken cancellationToken)
    {
        await _eventService.RemoveMemberAsync(id, CurrentUserId, memberUserId, cancellationToken);
        return Ok(new { success = true });
    }
}
