using Eventum.Application.Gifts.DTOs;
using Eventum.Application.Guests.DTOs;
using Eventum.Application.Public.DTOs;
using Eventum.Application.Public.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eventum.Api.Controllers;

[AllowAnonymous]
[Route("api/v1/public")]
public class PublicController : BaseApiController
{
    private readonly IPublicService _publicService;

    public PublicController(IPublicService publicService)
    {
        _publicService = publicService;
    }

    [HttpGet("invite/{token}")]
    public async Task<IActionResult> GetInvite(string token, CancellationToken cancellationToken)
    {
        var response = await _publicService.GetInviteByTokenAsync(token, cancellationToken);
        return Ok(response);
    }

    [HttpPost("invite/{token}/respond")]
    public async Task<IActionResult> RespondInvite(string token, [FromBody] RespondInviteRequest request, CancellationToken cancellationToken)
    {
        var success = await _publicService.RespondInviteAsync(token, request, cancellationToken);
        return Ok(new { success });
    }

    [HttpGet("reconfirmation/{token}")]
    public async Task<IActionResult> GetReconfirmation(string token, CancellationToken cancellationToken)
    {
        var response = await _publicService.GetReconfirmationByTokenAsync(token, cancellationToken);
        return Ok(response);
    }

    [HttpPost("reconfirmation/{token}/respond")]
    public async Task<IActionResult> RespondReconfirmation(string token, [FromBody] RespondReconfirmationRequest request, CancellationToken cancellationToken)
    {
        var success = await _publicService.RespondReconfirmationAsync(token, request, cancellationToken);
        return Ok(new { success });
    }

    [HttpGet("events/{slug}")]
    public async Task<IActionResult> GetPublicEvent(string slug, CancellationToken cancellationToken)
    {
        var ev = await _publicService.GetPublicEventBySlugAsync(slug, cancellationToken);
        return Ok(ev);
    }

    [HttpGet("events/{slug}/gifts")]
    public async Task<IActionResult> GetPublicGifts(string slug, CancellationToken cancellationToken)
    {
        var gifts = await _publicService.GetPublicGiftsBySlugAsync(slug, cancellationToken);
        return Ok(gifts);
    }

    [HttpPost("gifts/{giftId:guid}/reserve")]
    public async Task<IActionResult> ReserveGift(Guid giftId, CancellationToken cancellationToken)
    {
        var success = await _publicService.ReserveGiftAsync(giftId, cancellationToken);
        return Ok(new { success });
    }

    [HttpPost("gifts/{giftId:guid}/pay-pix")]
    public async Task<IActionResult> PayPixGift(Guid giftId, [FromBody] PayPixRequest request, CancellationToken cancellationToken)
    {
        var payment = await _publicService.PayPixGiftAsync(giftId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, payment);
    }

    [HttpPost("events/{eventId:guid}/mercadopago/create-payment")]
    public async Task<IActionResult> CreateMercadoPagoPayment(Guid eventId, [FromBody] CreateMercadoPagoPaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await _publicService.CreateMercadoPagoPaymentAsync(request with { EventId = eventId }, cancellationToken);
        return Ok(result);
    }
}
