using Eventum.Application.Subscriptions.DTOs;

namespace Eventum.Application.Subscriptions.Services;

public interface ISubscriptionService
{
    Task<IReadOnlyList<SubscriptionPlanDto>> GetPlansAsync(CancellationToken cancellationToken = default);
    Task<CurrentSubscriptionDto?> GetCurrentSubscriptionAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<SessionResponseDto> CreateCheckoutSessionAsync(Guid userId, CreateCheckoutSessionRequest request, CancellationToken cancellationToken = default);
    Task<SessionResponseDto> CreateCustomerPortalSessionAsync(Guid userId, CreateCustomerPortalRequest request, CancellationToken cancellationToken = default);
}
