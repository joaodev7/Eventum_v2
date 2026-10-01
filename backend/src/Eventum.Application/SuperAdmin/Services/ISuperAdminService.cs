using Eventum.Application.SuperAdmin.DTOs;

namespace Eventum.Application.SuperAdmin.Services;

public interface ISuperAdminService
{
    Task<SuperAdminStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SuperAdminUserDto>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<SuperAdminUserDetailDto> GetUserDetailAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> UpdateUserRoleAsync(Guid id, UpdateUserRoleRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SuperAdminEventDto>> GetEventsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SuperAdminSubscriptionDto>> GetSubscriptionsAsync(CancellationToken cancellationToken = default);
}
