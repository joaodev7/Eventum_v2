using Eventum.Domain.Enums;

namespace Eventum.Domain.Entities;

public class Subscription : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Trialing;
    public string BillingCycle { get; set; } = "monthly"; // monthly | yearly
    public DateTime? CurrentPeriodStart { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public bool CancelAtPeriodEnd { get; set; }

    public User User { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
}
