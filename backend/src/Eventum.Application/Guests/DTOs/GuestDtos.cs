using Eventum.Domain.Enums;

namespace Eventum.Application.Guests.DTOs;

public record GuestCompanionDto(
    Guid Id,
    Guid GuestId,
    string Name,
    bool? WillAttend
);

public record GuestDto(
    Guid Id,
    Guid EventId,
    string Name,
    string? Email,
    string? Phone,
    GuestGroup GuestGroup,
    Guid? TableId,
    string? TableName,
    string Token,
    InviteStatus Status,
    int Companions,
    bool HasViewed,
    DateTime? ViewedAt,
    DateTime? RespondedAt,
    string? Notes,
    DateTime? InviteEmailSentAt,
    bool SecondConfirmationSent,
    string? SecondConfirmationStatus,
    DateTime? SecondConfirmationRespondedAt,
    int SecondConfirmationCompanions,
    string? ReconfirmationToken,
    List<GuestCompanionDto> CompanionsList,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateGuestCompanionRequest(
    string Name
);

public record CreateGuestRequest(
    string Name,
    string? Email,
    string? Phone,
    GuestGroup GuestGroup,
    Guid? TableId,
    string? Notes,
    List<CreateGuestCompanionRequest>? Companions
);

public record UpdateGuestRequest(
    string Name,
    string? Email,
    string? Phone,
    GuestGroup GuestGroup,
    Guid? TableId,
    InviteStatus Status,
    string? Notes,
    List<CreateGuestCompanionRequest>? Companions
);

public record GuestMetricsDto(
    int Total,
    int TotalGuests,
    int TotalCompanions,
    int Accepted,
    int AcceptedGuests,
    int AcceptedCompanions,
    int Declined,
    int DeclinedGuests,
    int DeclinedCompanions,
    int Pending,
    int PendingGuests,
    int PendingCompanions,
    int Viewed,
    int ViewedGuests,
    int ViewedCompanions
);

public record SendGuestEmailsRequest(
    List<Guid> GuestIds
);

public record SendSecondConfirmationRequest(
    bool All,
    Guid? GuestId
);

public record RespondInviteRequest(
    InviteStatus Status,
    List<Guid>? CompanionIds
);

public record RespondReconfirmationRequest(
    string Status, // accepted | declined
    List<Guid>? CompanionIds
);
