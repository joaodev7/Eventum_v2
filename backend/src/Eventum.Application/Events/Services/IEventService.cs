using Eventum.Application.Events.DTOs;

namespace Eventum.Application.Events.Services;

public interface IEventService
{
    Task<IReadOnlyList<EventDto>> GetUserEventsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<EventDto> GetEventByIdAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<PublicEventDto?> GetEventBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<EventDto> CreateEventAsync(Guid userId, CreateEventRequest request, CancellationToken cancellationToken = default);
    Task<EventDto> UpdateEventAsync(Guid eventId, Guid userId, UpdateEventRequest request, CancellationToken cancellationToken = default);
    Task DeleteEventAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EventMemberDto>> GetMembersAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<EventMemberDto> AddMemberAsync(Guid eventId, Guid userId, AddEventMemberRequest request, CancellationToken cancellationToken = default);
    Task RemoveMemberAsync(Guid eventId, Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default);
}
