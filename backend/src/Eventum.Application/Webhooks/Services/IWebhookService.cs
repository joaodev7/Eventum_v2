namespace Eventum.Application.Webhooks.Services;

public interface IWebhookService
{
    Task<bool> HandleStripeWebhookAsync(string jsonPayload, string? signatureHeader, CancellationToken cancellationToken = default);
    Task<bool> HandleMercadoPagoWebhookAsync(string jsonPayload, string? xSignature, string? xRequestId, string? topic, string? id, CancellationToken cancellationToken = default);
}
