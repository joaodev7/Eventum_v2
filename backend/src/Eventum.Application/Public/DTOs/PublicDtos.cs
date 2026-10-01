using Eventum.Application.Events.DTOs;
using Eventum.Application.Gifts.DTOs;
using Eventum.Application.Guests.DTOs;
using Eventum.Domain.Enums;

namespace Eventum.Application.Public.DTOs;

public record PublicInviteGuestDto(
    Guid Id,
    string Name,
    InviteStatus Status,
    int Companions,
    string? TableName,
    List<GuestCompanionDto> CompanionsList
);

public record PublicInviteResponse(
    PublicInviteGuestDto Guest,
    PublicEventDto Event
);

public record PublicReconfirmationGuestDto(
    Guid Id,
    string Name,
    InviteStatus Status,
    string? SecondConfirmationStatus,
    int SecondConfirmationCompanions,
    List<GuestCompanionDto> CompanionsList
);

public record PublicReconfirmationResponse(
    PublicReconfirmationGuestDto Guest,
    PublicEventDto Event
);

public record PublicGiftsResponse(
    IReadOnlyList<GiftDto> Gifts,
    PixConfigDto? PixConfig
);

public record PayPixRequest(
    string GuestName,
    string? Message,
    Guid EventId
);
