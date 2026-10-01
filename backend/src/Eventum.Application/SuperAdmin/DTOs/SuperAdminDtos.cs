using Eventum.Application.Events.DTOs;
using Eventum.Domain.Enums;

namespace Eventum.Application.SuperAdmin.DTOs;

public record SuperAdminStatsDto(
    int TotalUsers,
    int TotalEvents,
    int ActiveSubscriptions,
    decimal MonthlyRecurringRevenue
);

public record SuperAdminUserDto(
    Guid Id,
    string Email,
    string? FullName,
    string? AvatarUrl,
    List<string> Roles,
    string? CurrentPlan,
    SubscriptionStatus? SubscriptionStatus,
    DateTime CreatedAt
);

public record SuperAdminUserDetailDto(
    Guid Id,
    string Email,
    string? FullName,
    string? AvatarUrl,
    string? StripeCustomerId,
    DateTime? TrialEndsAt,
    List<string> Roles,
    List<EventDto> Events,
    List<SuperAdminSubscriptionDto> Subscriptions,
    DateTime CreatedAt
);

public record UpdateUserRoleRequest(
    string Role // user | admin | superadmin
);

public record SuperAdminEventDto(
    Guid Id,
    string Slug,
    string EventName,
    EventType EventType,
    EventStatus Status,
    DateTime? EventDate,
    string? OwnerEmail,
    string? OwnerName,
    DateTime CreatedAt
);

public record SuperAdminSubscriptionDto(
    Guid Id,
    Guid UserId,
    string UserEmail,
    string PlanName,
    string PlanDisplayName,
    SubscriptionStatus Status,
    string BillingCycle,
    DateTime? CurrentPeriodEnd,
    DateTime CreatedAt
);
