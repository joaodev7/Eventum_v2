using Eventum.Application.Events.DTOs;
using Eventum.Application.Gifts.DTOs;
using Eventum.Application.Guests.DTOs;
using Eventum.Application.Public.DTOs;

namespace Eventum.Application.Public.Services;

public interface IPublicService
{
    Task<PublicInviteResponse> GetInviteByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<bool> RespondInviteAsync(string token, RespondInviteRequest request, CancellationToken cancellationToken = default);

    Task<PublicReconfirmationResponse> GetReconfirmationByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<bool> RespondReconfirmationAsync(string token, RespondReconfirmationRequest request, CancellationToken cancellationToken = default);

    Task<PublicEventDto> GetPublicEventBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<PublicGiftsResponse> GetPublicGiftsBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<bool> ReserveGiftAsync(Guid giftId, CancellationToken cancellationToken = default);
    Task<GiftPaymentDto> PayPixGiftAsync(Guid giftId, PayPixRequest request, CancellationToken cancellationToken = default);
    Task<MercadoPagoPaymentResult> CreateMercadoPagoPaymentAsync(CreateMercadoPagoPaymentRequest request, CancellationToken cancellationToken = default);
}
