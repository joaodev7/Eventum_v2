namespace Eventum.Domain.Entities;

public class FeatureFlag : BaseEntity
{
    public string FeatureKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string MinPlan { get; set; } = "free";
}
