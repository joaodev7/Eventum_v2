using Eventum.Domain.Enums;

namespace Eventum.Application.Events.DTOs;

public record CreateEventRequest(
    string EventName,
    EventType EventType,
    DateTime? EventDate,
    string? EventTime,
    string? VenueName,
    string? VenueAddress
);

public record UpdateEventRequest(
    string EventName,
    EventType EventType,
    DateTime? EventDate,
    string? EventTime,
    string? VenueName,
    string? VenueAddress,
    string? VenueMapsLink,
    string? HeroImageUrl,
    string? InviteImageUrl,
    string? WelcomeMessage,
    List<string>? GalleryImages,
    string? ThemeConfigJson,
    string? SettingsJson,
    EventStatus Status
);

public record EventDto(
    Guid Id,
    string Slug,
    EventType EventType,
    string EventName,
    DateTime? EventDate,
    string? EventTime,
    string? VenueName,
    string? VenueAddress,
    string? VenueMapsLink,
    string? HeroImageUrl,
    string? InviteImageUrl,
    string? WelcomeMessage,
    List<string> GalleryImages,
    string ThemeConfigJson,
    string SettingsJson,
    EventStatus Status,
    Guid? CreatedBy,
    string UserRole,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record PublicEventDto(
    Guid Id,
    string Slug,
    EventType EventType,
    string EventName,
    DateTime? EventDate,
    string? EventTime,
    string? VenueName,
    string? VenueAddress,
    string? VenueMapsLink,
    string? HeroImageUrl,
    string? WelcomeMessage,
    List<string> GalleryImages,
    string ThemeConfigJson,
    string SettingsJson
);

public record EventMemberDto(
    Guid Id,
    Guid UserId,
    string Email,
    string? FullName,
    EventRole Role,
    DateTime CreatedAt
);

public record AddEventMemberRequest(
    string Email,
    EventRole Role
);
