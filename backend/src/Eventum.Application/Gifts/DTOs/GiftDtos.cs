namespace Eventum.Application.Gifts.DTOs;

public record GiftDto(
    Guid Id,
    Guid EventId,
    string Name,
    string? Description,
    decimal Value,
    string? ImageUrl,
    string Status, // available | reserved | received
    bool IsFlexibleValue,
    decimal? MinValue,
    DateTime? ReservedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateGiftRequest(
    string Name,
    string? Description,
    decimal Value,
    string? ImageUrl,
    bool IsFlexibleValue,
    decimal? MinValue
);

public record UpdateGiftRequest(
    string Name,
    string? Description,
    decimal Value,
    string? ImageUrl,
    string Status,
    bool IsFlexibleValue,
    decimal? MinValue
);

public record PixConfigDto(
    Guid Id,
    Guid EventId,
    string? PixKey,
    string? RecipientName,
    string? QrCodeUrl
);

public record UpdatePixConfigRequest(
    string? PixKey,
    string? RecipientName,
    string? QrCodeUrl
);

public record GiftPaymentDto(
    Guid Id,
    Guid GiftId,
    Guid? EventId,
    string? GuestName,
    string? Message,
    string Status, // pending | confirmed
    DateTime? ConfirmedAt,
    DateTime CreatedAt,
    string? GiftName,
    decimal? GiftValue
);

public record MercadoPagoStatusDto(
    bool IsConnected,
    string? Email,
    string? PublicKey
);

public record CreateMercadoPagoPaymentRequest(
    Guid GiftId,
    string GiftName,
    decimal GiftValue,
    string GuestName,
    string? Message,
    Guid EventId
);

public record MercadoPagoPaymentResult(
    string PreferenceId,
    string InitPoint
);
