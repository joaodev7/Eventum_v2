using Eventum.Application.Guests.DTOs;
using Eventum.Domain.Enums;

namespace Eventum.Application.Guests.Services;

public interface IGuestService
{
    Task<IReadOnlyList<GuestDto>> GetGuestsAsync(
        Guid eventId,
        Guid userId,
        InviteStatus? status = null,
        GuestGroup? group = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    Task<GuestMetricsDto> GetMetricsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);

    Task<GuestDto> GetGuestByIdAsync(Guid eventId, Guid guestId, Guid userId, CancellationToken cancellationToken = default);

    Task<GuestDto> CreateGuestAsync(Guid eventId, Guid userId, CreateGuestRequest request, CancellationToken cancellationToken = default);

    Task<GuestDto> UpdateGuestAsync(Guid eventId, Guid guestId, Guid userId, UpdateGuestRequest request, CancellationToken cancellationToken = default);

    Task<bool> DeleteGuestAsync(Guid eventId, Guid guestId, Guid userId, CancellationToken cancellationToken = default);

    Task<string> RegenerateTokenAsync(Guid eventId, Guid guestId, Guid userId, CancellationToken cancellationToken = default);

    Task<int> SendEmailsAsync(Guid eventId, Guid userId, List<Guid> guestIds, CancellationToken cancellationToken = default);

    Task<int> SendSecondConfirmationAsync(Guid eventId, Guid userId, bool all, Guid? guestId, CancellationToken cancellationToken = default);
}
