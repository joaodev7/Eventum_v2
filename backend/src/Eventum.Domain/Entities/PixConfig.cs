namespace Eventum.Domain.Entities;

public class PixConfig : BaseEntity
{
    public Guid EventId { get; set; }
    public string? PixKey { get; set; }
    public string? RecipientName { get; set; }
    public string? QrCodeUrl { get; set; }

    public Event Event { get; set; } = null!;
}
