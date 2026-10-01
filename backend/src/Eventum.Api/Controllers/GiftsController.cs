using Eventum.Application.Gifts.DTOs;
using Eventum.Application.Gifts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[Authorize]
public class GiftsController : BaseApiController
{
    private readonly IGiftService _giftService;

    public GiftsController(IGiftService giftService)
    {
        _giftService = giftService;
    }

    [HttpGet("api/v1/events/{eventId:guid}/gifts")]
    public async Task<IActionResult> GetGifts(Guid eventId, CancellationToken cancellationToken)
    {
        var gifts = await _giftService.GetGiftsAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(gifts);
    }

    [HttpGet("api/v1/events/{eventId:guid}/gifts/{id:guid}")]
    public async Task<IActionResult> GetGiftById(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var gift = await _giftService.GetGiftByIdAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(gift);
    }

    [HttpPost("api/v1/events/{eventId:guid}/gifts")]
    public async Task<IActionResult> CreateGift(Guid eventId, [FromBody] CreateGiftRequest request, CancellationToken cancellationToken)
    {
        var gift = await _giftService.CreateGiftAsync(eventId, CurrentUserId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, gift);
    }

    [HttpPut("api/v1/events/{eventId:guid}/gifts/{id:guid}")]
    public async Task<IActionResult> UpdateGift(Guid eventId, Guid id, [FromBody] UpdateGiftRequest request, CancellationToken cancellationToken)
    {
        var gift = await _giftService.UpdateGiftAsync(eventId, id, CurrentUserId, request, cancellationToken);
        return Ok(gift);
    }

    [HttpDelete("api/v1/events/{eventId:guid}/gifts/{id:guid}")]
    public async Task<IActionResult> DeleteGift(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var success = await _giftService.DeleteGiftAsync(eventId, id, CurrentUserId, cancellationToken);
        return Ok(new { success });
    }

    // PIX
    [HttpGet("api/v1/events/{eventId:guid}/pix")]
    public async Task<IActionResult> GetPixConfig(Guid eventId, CancellationToken cancellationToken)
    {
        var pix = await _giftService.GetPixConfigAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(pix);
    }

    [HttpPut("api/v1/events/{eventId:guid}/pix")]
    public async Task<IActionResult> UpdatePixConfig(Guid eventId, [FromBody] UpdatePixConfigRequest request, CancellationToken cancellationToken)
    {
        var pix = await _giftService.UpdatePixConfigAsync(eventId, CurrentUserId, request, cancellationToken);
        return Ok(pix);
    }

    // Payments
    [HttpGet("api/v1/events/{eventId:guid}/gift-payments")]
    public async Task<IActionResult> GetGiftPayments(Guid eventId, CancellationToken cancellationToken)
    {
        var payments = await _giftService.GetGiftPaymentsAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(payments);
    }

    [HttpPost("api/v1/events/{eventId:guid}/gift-payments/{paymentId:guid}/approve")]
    public async Task<IActionResult> ApprovePayment(Guid eventId, Guid paymentId, CancellationToken cancellationToken)
    {
        var success = await _giftService.ApprovePaymentAsync(eventId, paymentId, CurrentUserId, cancellationToken);
        return Ok(new { success });
    }

    // Mercado Pago
    [HttpGet("api/v1/events/{eventId:guid}/mercadopago/status")]
    public async Task<IActionResult> GetMercadoPagoStatus(Guid eventId, CancellationToken cancellationToken)
    {
        var status = await _giftService.GetMercadoPagoStatusAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(status);
    }

    [HttpGet("api/v1/events/{eventId:guid}/mercadopago/oauth-start")]
    public async Task<IActionResult> StartMercadoPagoOAuth(Guid eventId, [FromQuery] string redirectUri, CancellationToken cancellationToken)
    {
        var url = await _giftService.GetMercadoPagoOAuthStartUrlAsync(eventId, CurrentUserId, redirectUri, cancellationToken);
        return Ok(new { url });
    }

    [HttpPost("api/v1/events/{eventId:guid}/mercadopago/oauth-callback")]
    public async Task<IActionResult> HandleMercadoPagoCallback(Guid eventId, [FromBody] MercadoPagoCallbackRequest request, CancellationToken cancellationToken)
    {
        var success = await _giftService.HandleMercadoPagoOAuthCallbackAsync(eventId, request.Code, request.RedirectUri, cancellationToken);
        return Ok(new { success });
    }

    [HttpPost("api/v1/events/{eventId:guid}/mercadopago/disconnect")]
    public async Task<IActionResult> DisconnectMercadoPago(Guid eventId, CancellationToken cancellationToken)
    {
        var success = await _giftService.DisconnectMercadoPagoAsync(eventId, CurrentUserId, cancellationToken);
        return Ok(new { success });
    }
}

public record MercadoPagoCallbackRequest(
    string Code,
    string RedirectUri
);
