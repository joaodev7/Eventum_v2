namespace Eventum.Domain.Entities;

public class GiftPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GiftId { get; set; }
    public Guid? EventId { get; set; }
    public string? GuestName { get; set; }
    public string? Message { get; set; }
    public string Status { get; set; } = "pending"; // pending | confirmed
    public DateTime? ConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Gift Gift { get; set; } = null!;
    public Event? Event { get; set; }
}
