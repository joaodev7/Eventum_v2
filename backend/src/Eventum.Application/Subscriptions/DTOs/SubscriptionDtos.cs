using Eventum.Domain.Enums;

namespace Eventum.Application.Subscriptions.DTOs;

public record SubscriptionPlanDto(
    Guid Id,
    string Name,
    string DisplayName,
    decimal PriceMonthly,
    decimal PriceYearly,
    string? StripePriceIdMonthly,
    string? StripePriceIdYearly,
    string FeaturesJson,
    string LimitsJson,
    decimal PlatformFeePercent,
    bool IsActive,
    int SortOrder
);

public record CurrentSubscriptionDto(
    Guid Id,
    Guid PlanId,
    string PlanName,
    string PlanDisplayName,
    SubscriptionStatus Status,
    string BillingCycle,
    DateTime? CurrentPeriodStart,
    DateTime? CurrentPeriodEnd,
    bool CancelAtPeriodEnd
);

public record CreateCheckoutSessionRequest(
    Guid PlanId,
    string BillingCycle, // monthly | yearly
    string? SuccessUrl,
    string? CancelUrl
);

public record CreateCustomerPortalRequest(
    string? ReturnUrl
);

public record SessionResponseDto(
    string Url
);
