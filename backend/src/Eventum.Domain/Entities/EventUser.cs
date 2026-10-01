using Eventum.Domain.Enums;

namespace Eventum.Domain.Entities;

public class EventUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public EventRole Role { get; set; } = EventRole.Viewer;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}
