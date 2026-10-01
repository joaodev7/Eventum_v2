using Eventum.Application.Gifts.DTOs;

namespace Eventum.Application.Gifts.Services;

public interface IGiftService
{
    Task<IReadOnlyList<GiftDto>> GetGiftsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<GiftDto> GetGiftByIdAsync(Guid eventId, Guid giftId, Guid userId, CancellationToken cancellationToken = default);
    Task<GiftDto> CreateGiftAsync(Guid eventId, Guid userId, CreateGiftRequest request, CancellationToken cancellationToken = default);
    Task<GiftDto> UpdateGiftAsync(Guid eventId, Guid giftId, Guid userId, UpdateGiftRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteGiftAsync(Guid eventId, Guid giftId, Guid userId, CancellationToken cancellationToken = default);

    Task<PixConfigDto> GetPixConfigAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<PixConfigDto> UpdatePixConfigAsync(Guid eventId, Guid userId, UpdatePixConfigRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GiftPaymentDto>> GetGiftPaymentsAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ApprovePaymentAsync(Guid eventId, Guid paymentId, Guid userId, CancellationToken cancellationToken = default);

    Task<MercadoPagoStatusDto> GetMercadoPagoStatusAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
    Task<string> GetMercadoPagoOAuthStartUrlAsync(Guid eventId, Guid userId, string redirectUri, CancellationToken cancellationToken = default);
    Task<bool> HandleMercadoPagoOAuthCallbackAsync(Guid eventId, string code, string redirectUri, CancellationToken cancellationToken = default);
    Task<bool> DisconnectMercadoPagoAsync(Guid eventId, Guid userId, CancellationToken cancellationToken = default);
}
