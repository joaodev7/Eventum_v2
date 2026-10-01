namespace Eventum.Domain.Entities;

public class InviteEmail
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Guid GuestId { get; set; }
    public string Status { get; set; } = "sent"; // sent | failed
    public string? ResendId { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Event Event { get; set; } = null!;
    public Guest Guest { get; set; } = null!;
}
