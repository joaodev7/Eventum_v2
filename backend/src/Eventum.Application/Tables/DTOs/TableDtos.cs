using Eventum.Application.Guests.DTOs;

namespace Eventum.Application.Tables.DTOs;

public record TableDto(
    Guid Id,
    Guid EventId,
    string Name,
    int Capacity,
    string? Description,
    int AssignedGuestsCount,
    DateTime CreatedAt
);

public record TableGuestDto(
    Guid Id,
    string Name,
    string? Email,
    string? Phone,
    int Companions,
    string Status
);

public record TableWithGuestsDto(
    Guid Id,
    Guid EventId,
    string Name,
    int Capacity,
    string? Description,
    List<TableGuestDto> Guests,
    DateTime CreatedAt
);

public record CreateTableRequest(
    string Name,
    int Capacity,
    string? Description
);

public record UpdateTableRequest(
    string Name,
    int Capacity,
    string? Description
);
