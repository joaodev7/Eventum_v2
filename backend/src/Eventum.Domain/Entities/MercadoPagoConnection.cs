namespace Eventum.Domain.Entities;

public class MercadoPagoConnection : BaseEntity
{
    public Guid EventId { get; set; }
    public string MpUserId { get; set; } = string.Empty;
    public string? MpEmail { get; set; }
    public string? MpPublicKey { get; set; }
    public string AccessTokenEncrypted { get; set; } = string.Empty;
    public string RefreshTokenEncrypted { get; set; } = string.Empty;
    public DateTime TokenExpiresAt { get; set; }
    public DateTime? ConnectedAt { get; set; } = DateTime.UtcNow;

    public Event Event { get; set; } = null!;
}
