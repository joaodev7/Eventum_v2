namespace Eventum.Domain.Entities;

public class Table : BaseEntity
{
    public Guid EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; } = 10;
    public string? Description { get; set; }

    public Event Event { get; set; } = null!;
    public ICollection<Guest> Guests { get; set; } = new List<Guest>();
}
