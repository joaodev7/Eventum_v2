using Eventum.Application.Common.Interfaces;
using Eventum.Domain.Entities;
using Eventum.Domain.Enums;
using Eventum.Domain.Exceptions;
using Eventum.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Eventum.Infrastructure.Services;

public class EventAuthorizationService : IEventAuthorizationService
{
    private readonly EventumDbContext _context;

    public EventAuthorizationService(EventumDbContext context)
    {
        _context = context;
    }

    private async Task<bool> IsSuperadminAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AnyAsync(r => r.UserId == userId && r.Role == AppRole.Superadmin, cancellationToken);
    }

    public async Task<bool> HasAccessAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await IsSuperadminAsync(userId, cancellationToken))
            return true;

        return await _context.EventUsers
            .AnyAsync(eu => eu.EventId == eventId && eu.UserId == userId, cancellationToken);
    }

    public async Task<bool> CanManageAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await IsSuperadminAsync(userId, cancellationToken))
            return true;

        return await _context.EventUsers
            .AnyAsync(eu => eu.EventId == eventId && eu.UserId == userId &&
                           (eu.Role == EventRole.Owner || eu.Role == EventRole.Admin), cancellationToken);
    }

    public async Task<bool> IsOwnerAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await IsSuperadminAsync(userId, cancellationToken))
            return true;

        return await _context.EventUsers
            .AnyAsync(eu => eu.EventId == eventId && eu.UserId == userId && eu.Role == EventRole.Owner, cancellationToken);
    }

    public async Task EnsureHasAccessAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        var hasAccess = await HasAccessAsync(eventId, userId, cancellationToken);
        if (!hasAccess)
        {
            throw new UnauthorizedDomainException($"User '{userId}' does not have access to event '{eventId}'.");
        }
    }

    public async Task EnsureCanManageAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default)
    {
        var canManage = await CanManageAsync(eventId, userId, cancellationToken);
        if (!canManage)
        {
            throw new UnauthorizedDomainException($"User '{userId}' does not have management permissions for event '{eventId}'.");
        }
    }
}
