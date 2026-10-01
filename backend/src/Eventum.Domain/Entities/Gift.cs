namespace Eventum.Domain.Entities;

public class Gift : BaseEntity
{
    public Guid EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Value { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "available"; // available | reserved | received
    public bool IsFlexibleValue { get; set; } = false;
    public decimal? MinValue { get; set; }
    public DateTime? ReservedAt { get; set; }

    public Event Event { get; set; } = null!;
    public ICollection<GiftPayment> Payments { get; set; } = new List<GiftPayment>();
}
