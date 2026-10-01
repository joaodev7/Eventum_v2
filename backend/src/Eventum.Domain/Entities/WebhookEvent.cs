namespace Eventum.Domain.Entities;

public class WebhookEvent : BaseEntity
{
    public string Provider { get; set; } = string.Empty; // stripe | mercadopago
    public string ExternalEventId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public string Status { get; set; } = "received"; // received | processed | failed
    public string? ErrorMessage { get; set; }
}
