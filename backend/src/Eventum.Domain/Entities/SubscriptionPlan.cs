namespace Eventum.Domain.Entities;

public class SubscriptionPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal PriceMonthly { get; set; }
    public decimal PriceYearly { get; set; }
    public string? StripePriceIdMonthly { get; set; }
    public string? StripePriceIdYearly { get; set; }
    public string FeaturesJson { get; set; } = "[]";
    public string LimitsJson { get; set; } = "{}";
    public decimal PlatformFeePercent { get; set; } = 5.0m;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
