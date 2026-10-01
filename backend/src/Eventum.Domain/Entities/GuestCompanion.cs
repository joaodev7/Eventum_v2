namespace Eventum.Domain.Entities;

public class GuestCompanion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Guid GuestId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool? WillAttend { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Event Event { get; set; } = null!;
    public Guest Guest { get; set; } = null!;
}
