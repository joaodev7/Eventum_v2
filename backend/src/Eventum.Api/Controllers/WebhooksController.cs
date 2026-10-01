using System.Text;
using Eventum.Application.Webhooks.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[AllowAnonymous]
[Route("api/v1/webhooks")]
public class WebhooksController : BaseApiController
{
    private readonly IWebhookService _webhookService;

    public WebhooksController(IWebhookService webhookService)
    {
        _webhookService = webhookService;
    }

    [HttpPost("stripe")]
    public async Task<IActionResult> HandleStripeWebhook(CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var jsonPayload = await reader.ReadToEndAsync(cancellationToken);

        var signatureHeader = Request.Headers["Stripe-Signature"].ToString();

        var success = await _webhookService.HandleStripeWebhookAsync(jsonPayload, signatureHeader, cancellationToken);
        return success ? Ok(new { received = true }) : BadRequest(new { error = "Falha no processamento do webhook Stripe" });
    }

    [HttpPost("mercadopago")]
    public async Task<IActionResult> HandleMercadoPagoWebhook(
        [FromQuery] string? topic,
        [FromQuery] string? id,
        CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var jsonPayload = await reader.ReadToEndAsync(cancellationToken);

        var xSignature = Request.Headers["x-signature"].ToString();
        var xRequestId = Request.Headers["x-request-id"].ToString();

        var success = await _webhookService.HandleMercadoPagoWebhookAsync(jsonPayload, xSignature, xRequestId, topic, id, cancellationToken);
        return success ? Ok(new { received = true }) : BadRequest(new { error = "Falha no processamento do webhook Mercado Pago" });
    }
}
